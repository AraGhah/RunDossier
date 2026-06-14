import { query } from '../db.js';

interface CostEntry {
  agentName: string;
  prospectId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

// Pricing per 1M tokens (update as needed)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001':   { input: 0.80, output: 4.00 },
  'claude-sonnet-4-6':           { input: 3.00, output: 15.00 },
  'gemini-2.5-pro':              { input: 1.25, output: 10.00 },
};

export async function logCost(entry: CostEntry) {
  const rates = PRICING[entry.model] ?? { input: 3.0, output: 15.0 };
  const costUsd =
    (entry.inputTokens / 1_000_000) * rates.input +
    (entry.outputTokens / 1_000_000) * rates.output;

  await query(
    `INSERT INTO ai_costs (agent_name, prospect_id, model, input_tokens, output_tokens, cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entry.agentName, entry.prospectId, entry.model, entry.inputTokens, entry.outputTokens, costUsd]
  );

  return costUsd;
}
