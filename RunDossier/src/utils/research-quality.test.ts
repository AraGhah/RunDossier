import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResearchQuality } from './research-quality.js';
import type { ResearchOutput } from '../agents/research.agent.js';

function baseOutput(overrides: Partial<ResearchOutput> = {}): ResearchOutput {
  return {
    top_3_signals: [
      {
        signal: 'Raised Series B ($42M) to expand enterprise sales in EMEA, announced March 2025',
        source: 'https://techcrunch.com/example-series-b',
        date: '2025-03-01',
      },
      {
        signal: 'Hiring 3 SDR managers and a RevOps lead per LinkedIn jobs page',
        source: 'https://linkedin.com/jobs/view/12345',
        date: '2025-05-10',
      },
    ],
    buying_triggers: ['scaling outbound'],
    research_summary:
      'Recent funding and aggressive SDR hiring suggest they are investing in outbound pipeline growth.',
    confidence_score: 78,
    ...overrides,
  };
}

describe('evaluateResearchQuality', () => {
  it('accepts research with 2+ verifiable signals and adequate confidence', () => {
    const result = evaluateResearchQuality(baseOutput());
    assert.equal(result.acceptable, true);
    assert.equal(result.reason, null);
    assert.equal(result.meaningfulSignalCount, 2);
  });

  it('rejects when fewer than 2 meaningful signals', () => {
    const result = evaluateResearchQuality(
      baseOutput({
        top_3_signals: [
          {
            signal: 'Works at Acme Corp as VP Sales',
            source: 'linkedin profile',
            date: '2024-01-01',
          },
        ],
      })
    );
    assert.equal(result.acceptable, false);
    assert.equal(result.reason, 'fewer_than_2_verifiable_signals');
  });

  it('rejects low confidence even with signals present', () => {
    const result = evaluateResearchQuality(baseOutput({ confidence_score: 45 }));
    assert.equal(result.acceptable, false);
    assert.equal(result.reason, 'confidence_below_floor');
  });

  it('rejects duplicate or near-duplicate signals', () => {
    const dup = 'Launched new integration with HubSpot for pipeline sync in April 2025';
    const result = evaluateResearchQuality(
      baseOutput({
        top_3_signals: [
          { signal: dup, source: 'https://company.com/blog/hubspot', date: '2025-04-01' },
          { signal: dup, source: 'https://news.example.com/hubspot', date: '2025-04-02' },
        ],
      })
    );
    assert.equal(result.acceptable, false);
    assert.equal(result.reason, 'duplicate_signals');
  });
});
