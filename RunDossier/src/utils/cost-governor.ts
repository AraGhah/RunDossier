/**
 * Cost Governor v1 — shared caps + pure decision logic.
 *
 *  - Per-prospect retry budget is a HARD ceiling ($0.25). The PER_PROSPECT_COST_CAP
 *    env var may only LOWER it (handy for tests); it can never raise it above the
 *    ceiling, so the budget is non-bypassable in code.
 *  - Daily soft-caps per client tier; a global daily ceiling triggers an alert.
 *
 * The alert channel is the existing free Telegram bot (see jobs/cost-governor.job.ts,
 * which calls notify()). No Twilio / paid SMS.
 *
 * Everything here is pure (no I/O) so it is unit-tested without a DB or network.
 */

/** Non-bypassable per-prospect AI retry budget (USD). See effectivePerProspectCapUsd(). */
export const PER_PROSPECT_HARD_CAP_USD = 0.25;

/** Daily soft-cap per client tier (USD). Unknown tiers fall back to the strictest (starter). */
export const TIER_DAILY_CAP_USD: Record<string, number> = {
  starter: 10,
  pro: 20,
  scale: 35,
};

/** Global daily ceiling across all clients (USD) -> immediate alert. */
export const GLOBAL_DAILY_CAP_USD = 50;

/**
 * Effective per-prospect cap. The PER_PROSPECT_COST_CAP env var may only LOWER the
 * budget; values above the hard ceiling (or invalid values) are clamped to the ceiling.
 * Non-bypassable upward by design.
 */
export function effectivePerProspectCapUsd(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.PER_PROSPECT_COST_CAP);
  if (Number.isFinite(raw) && raw > 0) return Math.min(raw, PER_PROSPECT_HARD_CAP_USD);
  return PER_PROSPECT_HARD_CAP_USD;
}

/** Daily soft-cap for a tier (case-insensitive); unknown/empty -> starter cap. */
export function tierDailyCapUsd(tier: string | null | undefined): number {
  const key = (tier ?? '').trim().toLowerCase();
  return TIER_DAILY_CAP_USD[key] ?? TIER_DAILY_CAP_USD.starter;
}

export interface ClientSpend {
  clientId: string;
  name: string | null;
  tier: string | null;
  costUsd: number;
}

export interface ClientBreach extends ClientSpend {
  capUsd: number;
  overUsd: number;
}

export interface GovernorReport {
  date: string;
  totalUsd: number;
  breaches: ClientBreach[];
  global: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Clients whose spend exceeded their tier soft-cap, worst overage first. */
export function clientBreaches(rows: ClientSpend[]): ClientBreach[] {
  return rows
    .map((r) => {
      const capUsd = tierDailyCapUsd(r.tier);
      return { ...r, capUsd, overUsd: round2(r.costUsd - capUsd) };
    })
    .filter((r) => r.costUsd > r.capUsd)
    .sort((a, b) => b.overUsd - a.overUsd);
}

/** True when total daily spend exceeded the global ceiling. */
export function globalBreach(totalUsd: number): boolean {
  return totalUsd > GLOBAL_DAILY_CAP_USD;
}

/** True when anything needs a Telegram alert. */
export function hasAlert(report: GovernorReport): boolean {
  return report.global || report.breaches.length > 0;
}

/** Build the Telegram alert text, or null when there is nothing to alert. */
export function formatGovernorAlert(report: GovernorReport): string | null {
  if (!hasAlert(report)) return null;

  const lines: string[] = [
    `[Cost Governor] ${report.date} (yesterday)`,
    `Global AI spend: ${usd(report.totalUsd)} / ${usd(GLOBAL_DAILY_CAP_USD)} cap`,
  ];

  if (report.global) {
    lines.push(`GLOBAL DAILY CAP EXCEEDED by ${usd(report.totalUsd - GLOBAL_DAILY_CAP_USD)}`);
  }

  if (report.breaches.length) {
    lines.push('', 'Clients over tier soft-cap:');
    for (const b of report.breaches) {
      lines.push(
        `- ${b.name ?? b.clientId} (${b.tier ?? 'starter'}): ${usd(b.costUsd)} / ${usd(b.capUsd)} (+${usd(b.overUsd)})`
      );
    }
  }

  return lines.join('\n');
}
