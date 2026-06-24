import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyBatchCounts,
  shouldDeliverParentBatch,
  pipelineActiveCount,
  type BatchStatusCounts,
} from './batch-progress.js';
import { config } from '../config.js';

const CHUNK = config.schedulerBatchSize;
const CYCLES = config.schedulerCyclesPerTick;

function simulateSchedulerTick(counts: BatchStatusCounts): void {
  let budget = CHUNK * CYCLES;
  const move = (from: keyof BatchStatusCounts, to: keyof BatchStatusCounts, n: number) => {
    const moved = Math.min(counts[from], budget, n);
    counts[from] -= moved;
    counts[to] += moved;
    budget -= moved;
    return moved;
  };
  move('queued', 'research_in_progress', budget);
  move('research_in_progress', 'research_complete', CHUNK);
  move('research_complete', 'personalization_in_progress', CHUNK);
  move('personalization_in_progress', 'personalized_qa_passed', CHUNK);
}

function runPipeline(total: number, thinPct = 0.1): BatchStatusCounts {
  const counts = emptyBatchCounts();
  counts.queued = total;
  let ticks = 0;
  const maxTicks = Math.ceil(total / (CHUNK * CYCLES)) * 8 + 50;

  while (ticks < maxTicks) {
    ticks += 1;
    if (pipelineActiveCount(counts) > 0) simulateSchedulerTick(counts);

    if (counts.research_in_progress > 0 && counts.queued === 0) {
      const n = counts.research_in_progress;
      counts.research_in_progress = 0;
      const thin = Math.floor(n * thinPct);
      counts.thin_research += thin;
      counts.research_complete += n - thin;
    }
    if (counts.personalization_in_progress > 0) {
      counts.personalization_in_progress = 0;
      counts.personalized_qa_passed += counts.research_complete;
      counts.research_complete = 0;
    }

    if (pipelineActiveCount(counts) === 0 && counts.personalized_qa_passed + counts.thin_research >= total) {
      break;
    }
  }
  return counts;
}

describe('stress simulation — large batch architecture', () => {
  for (const size of [25, 100, 250] as const) {
    it(`Test ${size}: processes all prospects without early delivery gate`, () => {
      const counts = runPipeline(size);
      const ready = counts.personalized_qa_passed;
      const done = ready + counts.thin_research;

      assert.equal(done, size, `all ${size} prospects must reach terminal research states`);
      assert.ok(ready > 0);

      const midProgress = {
        requested: size,
        imported: size,
        sourceExhausted: false,
        replacementUsed: false,
        counts: { ...counts, personalized_qa_passed: Math.min(44, ready), thin_research: counts.thin_research },
      };
      if (size > 50) {
        assert.equal(shouldDeliverParentBatch(midProgress), false, 'must not deliver at ~44 ready');
      }

      const finalProgress = {
        requested: size,
        imported: size,
        sourceExhausted: true,
        replacementUsed: false,
        counts,
      };
      assert.equal(shouldDeliverParentBatch(finalProgress), true);
    });
  }

  it('Test D — 1000-prospect simulation across 20+ internal chunks', () => {
    const total = 1000;
    const counts = runPipeline(total);
    const chunksProcessed = Math.ceil(total / CHUNK);
    assert.ok(chunksProcessed >= 20, `expected >=20 chunks of ${CHUNK}, got ${chunksProcessed}`);

    const ready = counts.personalized_qa_passed;
    assert.ok(ready >= total * 0.85, `expected >=85% QA-passed, got ${ready}`);

    let earlyDeliveryAttempted = false;
    for (let processed = CHUNK; processed < ready; processed += CHUNK) {
      const partial = { ...emptyBatchCounts(), personalized_qa_passed: processed, thin_research: 10 };
      if (shouldDeliverParentBatch({
        requested: total,
        imported: processed + 10,
        sourceExhausted: false,
        replacementUsed: false,
        counts: partial,
      })) {
        earlyDeliveryAttempted = true;
      }
    }
    assert.equal(earlyDeliveryAttempted, false, 'no early delivery before target or exhaustion');

    const finalGate = shouldDeliverParentBatch({
      requested: total,
      imported: total,
      sourceExhausted: true,
      replacementUsed: true,
      counts,
    });
    assert.equal(finalGate, true);
  });
});
