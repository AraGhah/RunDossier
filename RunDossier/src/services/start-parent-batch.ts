import { ingestProspects, type IntakeRecord, type IntakeResult } from './intake.js';
import { createParentBatch, refreshParentBatchCounters, type ParentBatch } from './parent-batch.js';
import { kickBatchOrchestrator } from '../utils/kick-orchestrator.js';

export interface StartParentBatchInput {
  clientId: string;
  requestedCount: number;
  prospects?: IntakeRecord[];
  metadata?: Record<string, unknown>;
}

export interface StartParentBatchResult {
  parentBatch: ParentBatch;
  intake: IntakeResult;
}

/**
 * Create a parent batch job and optionally ingest an initial prospect list.
 * The orchestrator continues processing in internal chunks until the target
 * is met, replacements are exhausted, or the batch is manually resumed.
 */
export async function startParentBatch(input: StartParentBatchInput): Promise<StartParentBatchResult> {
  if (input.requestedCount < 1 || input.requestedCount > 5000) {
    throw new Error('requestedCount must be between 1 and 5000');
  }

  const parentBatch = await createParentBatch({
    clientId: input.clientId,
    requestedCount: input.requestedCount,
    metadata: input.metadata,
  });

  let intake: IntakeResult = {
    inserted: 0,
    skipped: 0,
    invalid: 0,
    batchIds: [],
    prospectIds: [],
  };

  if (input.prospects && input.prospects.length > 0) {
    const records = input.prospects.map((p) => ({ ...p, client_id: input.clientId }));
    intake = await ingestProspects(records, { parentBatchId: parentBatch.id });
    await refreshParentBatchCounters(parentBatch.id);
  }

  void kickBatchOrchestrator(parentBatch.id);

  return { parentBatch, intake };
}
