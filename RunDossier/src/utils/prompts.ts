import { queryOne } from '../db.js';

export async function loadActivePrompt(
  agentName: string,
  fallback: string
): Promise<string> {
  const row = await queryOne<{ prompt_text: string }>(
    `SELECT prompt_text FROM prompt_versions
     WHERE agent_name = $1 AND active_bool = true
     ORDER BY version DESC LIMIT 1`,
    [agentName]
  );
  return row?.prompt_text?.trim() || fallback;
}
