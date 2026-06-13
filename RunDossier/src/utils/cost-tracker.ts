import { query } from '../db.js';

interface AiCallMeta {
  model: string;
  jobName: string;
  inputTokens: number;
  outputTokens: number;
  leadId?: string;
}

export async function trackCost(meta: AiCallMeta): Promise<void> {
  await query(
    `INSERT INTO ai_costs (model, job_name, input_tokens, output_tokens, lead_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [meta.model, meta.jobName, meta.inputTokens, meta.outputTokens, meta.leadId ?? null]
  );
}
