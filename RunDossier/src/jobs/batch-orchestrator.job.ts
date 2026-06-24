import { runBatchOrchestrator } from '../services/batch-orchestrator.js';

export async function runBatchOrchestratorJob(): Promise<void> {
  try {
    const summary = await runBatchOrchestrator();
    if (summary.deliveriesTriggered > 0 || summary.errors.length > 0) {
      console.log('[batch-orchestrator]', JSON.stringify(summary));
    }
  } catch (err) {
    console.error('[batch-orchestrator] job error:', err);
    throw err;
  }
}
