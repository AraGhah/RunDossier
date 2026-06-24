import { getBoss } from '../queue.js';
import { logger } from '../utils/logger.js';

/** Enqueue an orchestrator tick when pg-boss is running; otherwise rely on cron. */
export async function kickBatchOrchestrator(parentBatchId?: string): Promise<void> {
  try {
    const boss = getBoss();
    if (!boss?.send) return;
    await boss.send('batch-orchestrator', { parentBatchId: parentBatchId ?? null });
  } catch (err) {
    logger.warn('orchestrator_kickoff_skipped', {
      parentBatchId,
      reason: (err as Error).message,
    });
  }
}
