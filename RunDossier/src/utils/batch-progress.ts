/** Statuses still moving through research → personalize → QA (block final delivery). */
export const PIPELINE_ACTIVE_STATUSES = [
  'queued',
  'research_in_progress',
  'research_complete',
  'personalization_in_progress',
  'delivering',
] as const;

/** Retryable failures — orchestrator keeps scheduling until max retries. */
export const RETRYABLE_STATUSES = [
  'research_failed',
  'qa_failed',
  'personalization_failed',
] as const;

/** Terminal exclusions — counted but never delivered. */
export const TERMINAL_EXCLUDED_STATUSES = [
  'thin_research',
  'dead_letter',
] as const;

export interface BatchStatusCounts {
  queued: number;
  research_in_progress: number;
  research_complete: number;
  thin_research: number;
  research_failed: number;
  personalization_in_progress: number;
  personalized_qa_passed: number;
  qa_failed: number;
  personalization_failed: number;
  delivering: number;
  delivered: number;
  dead_letter: number;
}

export interface ParentBatchProgress {
  requested: number;
  imported: number;
  counts: BatchStatusCounts;
  sourceExhausted: boolean;
  replacementUsed: boolean;
}

export function emptyBatchCounts(): BatchStatusCounts {
  return {
    queued: 0,
    research_in_progress: 0,
    research_complete: 0,
    thin_research: 0,
    research_failed: 0,
    personalization_in_progress: 0,
    personalized_qa_passed: 0,
    qa_failed: 0,
    personalization_failed: 0,
    delivering: 0,
    delivered: 0,
    dead_letter: 0,
  };
}

export function sumCounts(counts: BatchStatusCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export function pipelineActiveCount(counts: BatchStatusCounts): number {
  return (
    counts.queued +
    counts.research_in_progress +
    counts.research_complete +
    counts.personalization_in_progress +
    counts.delivering
  );
}

export function retryableCount(counts: BatchStatusCounts): number {
  return counts.research_failed + counts.qa_failed + counts.personalization_failed;
}

export function excludedCount(counts: BatchStatusCounts): number {
  return counts.thin_research + counts.dead_letter;
}

export function failedTerminalCount(counts: BatchStatusCounts): number {
  return counts.research_failed + counts.qa_failed + counts.personalization_failed + counts.dead_letter;
}

export function readyToDeliverCount(counts: BatchStatusCounts): number {
  return counts.personalized_qa_passed;
}

export function percentComplete(progress: ParentBatchProgress): number {
  const { requested, counts } = progress;
  if (requested <= 0) return 0;
  const done = counts.delivered + excludedCount(counts) + failedTerminalCount(counts);
  return Math.min(100, Math.round((done / requested) * 100));
}

/**
 * Final delivery is allowed only when no prospects are still in the active pipeline
 * AND either we have enough QA-passed rows to fulfill the request, or sourcing is
 * exhausted and every imported prospect has reached a terminal state.
 */
export function shouldDeliverParentBatch(progress: ParentBatchProgress): boolean {
  const active = pipelineActiveCount(progress.counts);
  const retryable = retryableCount(progress.counts);
  if (active > 0 || retryable > 0) return false;

  const ready = readyToDeliverCount(progress.counts);
  const alreadyDelivered = progress.counts.delivered;
  const stillNeeded = Math.max(0, progress.requested - alreadyDelivered);

  if (ready <= 0) return false;

  if (ready >= stillNeeded) return true;

  if (progress.sourceExhausted) {
    const importedTerminal =
      sumCounts(progress.counts) >= progress.imported && progress.imported > 0;
    return importedTerminal;
  }

  return false;
}

export function resolveParentBatchCompletion(progress: ParentBatchProgress): {
  status: 'completed' | 'partial';
  fullyComplete: boolean;
  reason?: string;
} {
  const delivered = progress.counts.delivered + readyToDeliverCount(progress.counts);
  const requested = progress.requested;

  if (delivered >= requested) {
    return { status: 'completed', fullyComplete: true };
  }

  if (progress.sourceExhausted) {
    return {
      status: 'partial',
      fullyComplete: false,
      reason: `Input list exhausted: ${delivered}/${requested} qualified prospects available after exclusions and failures.`,
    };
  }

  return {
    status: 'partial',
    fullyComplete: false,
    reason: `Pipeline stopped before target: ${delivered}/${requested} qualified.`,
  };
}

/** Legacy client-level gate — still used when no parent_batch_id is set. */
export function shouldRunDelivery(pendingPipelineCount: number, readyCount: number): boolean {
  return pendingPipelineCount === 0 && readyCount > 0;
}

export function isBatchStalled(lastProgressAt: Date, stallMinutes: number, now = new Date()): boolean {
  const ageMs = now.getTime() - lastProgressAt.getTime();
  return ageMs > stallMinutes * 60_000;
}
