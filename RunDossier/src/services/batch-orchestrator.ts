import { config } from '../config.js';
import { query } from '../db.js';
import { notify } from '../notify.js';
import { runScheduler } from '../jobs/scheduler.job.js';
import { runDeliveryForParentBatch } from '../jobs/delivery.job.js';
import { listSearchProfiles, runProspectSearch } from './prospect-search.js';
import {
  listActiveParentBatches,
  refreshParentBatchCounters,
  getParentBatchProgress,
  markParentBatchSourceExhausted,
  markParentBatchReplacementUsed,
  recordStallAlert,
  markParentBatchStalled,
  logBatchEvent,
  reapStuckParentBatches,
  getLastProspectActivityAt,
  incrementSourceMissStreak,
  resetSourceMissStreak,
  incrementParentBatchChunk,
  type ParentBatch,
} from './parent-batch.js';
import {
  shouldDeliverParentBatch,
  isBatchStalled,
  readyToDeliverCount,
  pipelineActiveCount,
  retryableCount,
  excludedCount,
} from '../utils/batch-progress.js';
import { logger } from '../utils/logger.js';

export interface OrchestratorRunSummary {
  batchesChecked: number;
  deliveriesTriggered: number;
  replacementsSourced: number;
  stallsDetected: number;
  reapedDelivering: number;
  errors: string[];
}

async function trySourceReplacements(batch: ParentBatch): Promise<number> {
  if (batch.source_exhausted) return 0;

  const progress = await getParentBatchProgress(batch.id);
  if (!progress) return 0;

  const qualified = progress.counts.delivered + readyToDeliverCount(progress.counts);
  const deficit = batch.requested_prospect_count - qualified;
  if (deficit <= 0) return 0;

  const profiles = await listSearchProfiles(batch.client_id);
  const enabled = profiles.filter((p) => p.enabled);
  if (enabled.length === 0) return 0;

  let totalIngested = 0;
  const chunkSize = Math.min(config.orchestratorSourceChunkSize, deficit);

  for (const profile of enabled) {
    if (totalIngested >= chunkSize) break;
    try {
      const result = await runProspectSearch(profile.id, { parentBatchId: batch.id });
      const added = Math.min(result.ingested, chunkSize - totalIngested);
      totalIngested += added;
      if (added > 0) {
        await markParentBatchReplacementUsed(batch.id);
        await resetSourceMissStreak(batch.id);
        await incrementParentBatchChunk(batch.id);
        await logBatchEvent({
          parentBatchId: batch.id,
          eventType: 'replacement_sourced',
          message: `Sourced ${added} replacement prospect(s)`,
          metadata: { profile_id: profile.id, ingested: result.ingested, prospect_ids: result.prospectIds?.length },
        });
      }
    } catch (err) {
      logger.warn('orchestrator_replacement_search_failed', {
        parentBatchId: batch.id,
        profileId: profile.id,
        error: (err as Error).message,
      });
    }
  }

  if (totalIngested === 0 && pipelineActiveCount(progress.counts) === 0) {
    const streak = await incrementSourceMissStreak(batch.id);
    if (streak >= config.sourceExhaustionMissStreak) {
      await markParentBatchSourceExhausted(batch.id);
      await logBatchEvent({
        parentBatchId: batch.id,
        eventType: 'source_exhausted',
        message: `Source marked exhausted after ${streak} consecutive miss(es)`,
      });
    }
  }

  return totalIngested;
}

async function checkStall(batch: ParentBatch): Promise<boolean> {
  const lastActivity = (await getLastProspectActivityAt(batch.id)) ?? new Date(batch.created_at);
  if (!isBatchStalled(lastActivity, config.batchStallMinutes)) return false;

  const progress = await getParentBatchProgress(batch.id);
  if (!progress) return false;

  const active = pipelineActiveCount(progress.counts) + retryableCount(progress.counts);
  if (active > 0) return false;

  if (!batch.stall_alerted_at) {
    await recordStallAlert(batch.id);
    await markParentBatchStalled(batch.id);
    await notify(
      `⚠️ Parent batch stalled (${batch.id.slice(0, 8)}…)\n` +
        `Client: ${batch.client_id}\n` +
        `Progress: ${batch.delivered_count}/${batch.requested_prospect_count} delivered\n` +
        `Resume: POST /api/parent-batches/${batch.id}/resume`
    );
    await logBatchEvent({
      parentBatchId: batch.id,
      eventType: 'batch_stalled',
      message: `No prospect activity for ${config.batchStallMinutes} minutes`,
    });
    return true;
  }
  return false;
}

async function processParentBatch(batch: ParentBatch): Promise<{
  delivered: boolean;
  replacements: number;
  stalled: boolean;
  error?: string;
}> {
  await refreshParentBatchCounters(batch.id);

  const stalled = await checkStall(batch);
  if (stalled) return { delivered: false, replacements: 0, stalled: true };

  const progress = await getParentBatchProgress(batch.id);
  if (!progress) return { delivered: false, replacements: 0, stalled: false };

  let replacements = 0;
  const qualified = progress.counts.delivered + readyToDeliverCount(progress.counts);
  const needsMore =
    qualified < batch.requested_prospect_count &&
    pipelineActiveCount(progress.counts) === 0 &&
    retryableCount(progress.counts) === 0;

  if (needsMore && !progress.sourceExhausted) {
    replacements = await trySourceReplacements(batch);
    if (replacements > 0) {
      await refreshParentBatchCounters(batch.id);
      await runScheduler();
      return { delivered: false, replacements, stalled: false };
    }
  }

  if (!shouldDeliverParentBatch(progress)) {
    return { delivered: false, replacements, stalled: false };
  }

  try {
    const deliveryResult = await runDeliveryForParentBatch(batch.id);
    await logBatchEvent({
      parentBatchId: batch.id,
      eventType: 'delivery_triggered',
      message: `Delivered ${deliveryResult.delivered} prospect(s)`,
      metadata: {
        delivery_id: deliveryResult.deliveryId,
        fully_complete: deliveryResult.fullyComplete,
        finalized: deliveryResult.finalized,
        excluded: excludedCount(progress.counts),
      },
    });
    return { delivered: deliveryResult.finalized, replacements, stalled: false };
  } catch (err) {
    return { delivered: false, replacements, stalled: false, error: (err as Error).message };
  }
}

/** Main orchestrator tick — runs every 2 minutes via pg-boss. */
export async function runBatchOrchestrator(): Promise<OrchestratorRunSummary> {
  const summary: OrchestratorRunSummary = {
    batchesChecked: 0,
    deliveriesTriggered: 0,
    replacementsSourced: 0,
    stallsDetected: 0,
    reapedDelivering: 0,
    errors: [],
  };

  const reaped = await reapStuckParentBatches(config.deliveringReapMinutes);
  summary.reapedDelivering = reaped.length;

  await runScheduler();

  const active = await listActiveParentBatches();
  for (const batch of active) {
    summary.batchesChecked += 1;
    try {
      const result = await processParentBatch(batch);
      if (result.delivered) summary.deliveriesTriggered += 1;
      if (result.replacements > 0) summary.replacementsSourced += result.replacements;
      if (result.stalled) summary.stallsDetected += 1;
      if (result.error) summary.errors.push(`${batch.id}: ${result.error}`);
    } catch (err) {
      const message = (err as Error).message;
      logger.error('orchestrator_batch_error', { parentBatchId: batch.id, error: message });
      summary.errors.push(`${batch.id}: ${message}`);
    }
  }

  return summary;
}
