import type { BatchStatusCounts } from './batch-progress.js';
import { readyToDeliverCount, sumCounts } from './batch-progress.js';

export interface ReconciliationInput {
  parentBatchId: string;
  requested: number;
  claimedIds: string[];
  counts: BatchStatusCounts;
  csvRowCount?: number;
  deliveryLedgerCount?: number;
  sourceExhausted: boolean;
}

export interface ReconciliationResult {
  ok: boolean;
  errors: string[];
  summary: {
    requested: number;
    imported: number;
    ready: number;
    delivered: number;
    claimed: number;
    thin_research: number;
    excluded: number;
  };
}

/** Independently verify counts before finalizing a parent-batch delivery. */
export function reconcileDeliveryCounts(input: ReconciliationInput): ReconciliationResult {
  const errors: string[] = [];
  const imported = sumCounts(input.counts);
  const ready = readyToDeliverCount(input.counts);
  const claimed = input.claimedIds.length;
  const uniqueClaimed = new Set(input.claimedIds).size;

  if (uniqueClaimed !== claimed) {
    errors.push(`Duplicate prospect IDs in delivery claim (${claimed} vs ${uniqueClaimed} unique)`);
  }

  if (claimed === 0) {
    errors.push('Delivery claim is empty');
  }

  if (input.csvRowCount != null && input.csvRowCount !== claimed) {
    errors.push(`CSV row count (${input.csvRowCount}) does not match claimed (${claimed})`);
  }

  if (input.deliveryLedgerCount != null && input.deliveryLedgerCount !== claimed) {
    errors.push(
      `Delivery ledger prospect_count (${input.deliveryLedgerCount}) does not match claimed (${claimed})`
    );
  }

  const stillNeeded = Math.max(0, input.requested - input.counts.delivered);
  if (!input.sourceExhausted && ready > stillNeeded && claimed < stillNeeded) {
    errors.push(
      `Premature partial claim: ${claimed} claimed but ${stillNeeded} still needed (source not exhausted)`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      requested: input.requested,
      imported,
      ready,
      delivered: input.counts.delivered,
      claimed,
      thin_research: input.counts.thin_research,
      excluded: input.counts.thin_research + input.counts.dead_letter,
    },
  };
}
