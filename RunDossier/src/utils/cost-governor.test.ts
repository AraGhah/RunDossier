import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PER_PROSPECT_HARD_CAP_USD,
  GLOBAL_DAILY_CAP_USD,
  effectivePerProspectCapUsd,
  tierDailyCapUsd,
  clientBreaches,
  globalBreach,
  hasAlert,
  formatGovernorAlert,
  type ClientSpend,
  type GovernorReport,
} from './cost-governor.js';

describe('effectivePerProspectCapUsd (non-bypassable $0.25 ceiling)', () => {
  it('defaults to the hard cap when unset', () => {
    assert.equal(effectivePerProspectCapUsd({}), 0.25);
    assert.equal(PER_PROSPECT_HARD_CAP_USD, 0.25);
  });
  it('lets env LOWER the cap (for tests)', () => {
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: '0.10' }), 0.1);
  });
  it('CLAMPS any attempt to raise it above the ceiling', () => {
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: '5' }), 0.25);
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: '999999' }), 0.25);
  });
  it('ignores invalid / non-positive values', () => {
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: 'abc' }), 0.25);
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: '0' }), 0.25);
    assert.equal(effectivePerProspectCapUsd({ PER_PROSPECT_COST_CAP: '-3' }), 0.25);
  });
});

describe('tierDailyCapUsd', () => {
  it('maps known tiers', () => {
    assert.equal(tierDailyCapUsd('starter'), 10);
    assert.equal(tierDailyCapUsd('pro'), 20);
    assert.equal(tierDailyCapUsd('scale'), 35);
  });
  it('is case-insensitive and trims', () => {
    assert.equal(tierDailyCapUsd('  PRO '), 20);
  });
  it('falls back to starter for unknown/empty/null', () => {
    assert.equal(tierDailyCapUsd('enterprise'), 10);
    assert.equal(tierDailyCapUsd(''), 10);
    assert.equal(tierDailyCapUsd(null), 10);
    assert.equal(tierDailyCapUsd(undefined), 10);
  });
});

describe('clientBreaches', () => {
  const rows: ClientSpend[] = [
    { clientId: 'a', name: 'Acme', tier: 'starter', costUsd: 12.5 }, // over 10
    { clientId: 'b', name: 'Beta', tier: 'pro', costUsd: 18 }, // under 20
    { clientId: 'c', name: 'Cee', tier: 'scale', costUsd: 41 }, // over 35
    { clientId: 'd', name: 'Dee', tier: 'starter', costUsd: 10 }, // exactly at cap -> not over
  ];
  it('returns only clients strictly over their tier cap', () => {
    const b = clientBreaches(rows);
    assert.deepEqual(
      b.map((x) => x.clientId),
      ['c', 'a'] // sorted by overage desc: Cee +6, Acme +2.5
    );
  });
  it('computes overage', () => {
    const acme = clientBreaches(rows).find((x) => x.clientId === 'a')!;
    assert.equal(acme.capUsd, 10);
    assert.equal(acme.overUsd, 2.5);
  });
  it('returns empty when all under cap', () => {
    assert.deepEqual(clientBreaches([{ clientId: 'x', name: 'X', tier: 'pro', costUsd: 1 }]), []);
  });
});

describe('globalBreach', () => {
  it('true only when strictly over the global cap', () => {
    assert.equal(globalBreach(GLOBAL_DAILY_CAP_USD + 0.01), true);
    assert.equal(globalBreach(GLOBAL_DAILY_CAP_USD), false);
    assert.equal(globalBreach(10), false);
  });
});

describe('formatGovernorAlert', () => {
  const clean: GovernorReport = { date: '2026-06-22', totalUsd: 8, breaches: [], global: false };
  it('is null + no-alert when clean', () => {
    assert.equal(hasAlert(clean), false);
    assert.equal(formatGovernorAlert(clean), null);
  });
  it('flags a global breach', () => {
    const r: GovernorReport = { date: '2026-06-22', totalUsd: 62, breaches: [], global: true };
    const text = formatGovernorAlert(r)!;
    assert.match(text, /GLOBAL DAILY CAP EXCEEDED by \$12\.00/);
    assert.match(text, /\$62\.00 \/ \$50\.00 cap/);
  });
  it('lists client breaches', () => {
    const r: GovernorReport = {
      date: '2026-06-22',
      totalUsd: 30,
      breaches: [{ clientId: 'a', name: 'Acme', tier: 'starter', costUsd: 12.5, capUsd: 10, overUsd: 2.5 }],
      global: false,
    };
    const text = formatGovernorAlert(r)!;
    assert.match(text, /Acme \(starter\): \$12\.50 \/ \$10\.00 \(\+\$2\.50\)/);
  });
});
