import { query, queryOne } from '../db.js';
import { runPersonalizeAgent } from '../agents/personalize.agent.js';
import { runQAAgent } from '../agents/qa.agent.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';

export async function handlePersonalize(job: { data: { prospectId: string } }) {
  const { prospectId } = job.data;

  try {
    const [prospect] = await query<Record<string, any>>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status IN ('research_complete', 'personalization_in_progress')
       RETURNING *`,
      [prospectId]
    );
    if (!prospect) return;

    const prompt = await queryOne<{ id: string; prompt_text: string }>(
      `SELECT id, prompt_text FROM prompt_versions
       WHERE agent_name = 'personalization_agent' AND active_bool = true
       ORDER BY version DESC LIMIT 1`
    );
    if (!prompt?.prompt_text) {
      throw new Error('No active personalization prompt found');
    }

    const qaPrompt = await loadActivePrompt(
      'qa_agent',
      'You are a cold email QA judge. Score each variant on specificity, human-ness, relevance, and length. Return only valid JSON.'
    );

    const variants = await runPersonalizeAgent(
      prospectId,
      {
        name: prospect.name,
        title: prospect.title,
        research_summary: prospect.research_summary,
        top_3_signals: prospect.top_3_signals,
      },
      prompt.prompt_text
    );

    const qaResults = await runQAAgent(
      prospectId,
      variants,
      {
        name: prospect.name,
        research_summary: prospect.research_summary,
        top_3_signals: prospect.top_3_signals,
      },
      qaPrompt
    );

    await query('DELETE FROM first_lines WHERE prospect_id = $1', [prospectId]);

    let anyShipped = false;
    for (const variant of variants) {
      const qa = qaResults.find(q => q.variant_number === variant.variant_number);
      const verdict = qa && qa.qa_score >= config.qaScoreFloor ? 'ship' : 'reject';
      if (verdict === 'ship') anyShipped = true;

      await query(
        `INSERT INTO first_lines
         (prospect_id, variant_number, subject, opener, bridge, angle,
          qa_score, specificity_score, human_ness_score, relevance_score, length_ok,
          qa_verdict, qa_reason, model_used, prompt_version_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          prospectId, variant.variant_number,
          variant.subject, variant.opener, variant.bridge, variant.angle,
          qa?.qa_score ?? 0, qa?.specificity_score ?? 0,
          qa?.human_ness_score ?? 0, qa?.relevance_score ?? 0,
          qa?.length_ok ?? false, verdict, qa?.qa_reason ?? '',
          config.personalizeModel, prompt.id,
          verdict === 'ship' ? 'ready' : 'rejected',
        ]
      );
    }

    const newStatus = anyShipped ? 'personalized_qa_passed' : 'qa_failed';
    await query(
      'UPDATE prospects SET status = $1 WHERE id = $2',
      [newStatus, prospectId]
    );

    await notify(
      `Personalize ${anyShipped ? 'passed' : 'failed'}: ${prospect.name ?? prospectId} (${variants.length} variants)`
    );

  } catch (err) {
    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('personalize', $1, $2, $3)`,
      [prospectId, (err as Error).message, config.maxRetries]
    ).catch(e => console.error('[personalize] failed_jobs insert error:', e));

    await query(
      `UPDATE prospects SET status = 'personalization_failed'
       WHERE id = $1 AND status = 'personalization_in_progress'`,
      [prospectId]
    ).catch(e => console.error('[personalize] status reset error:', e));

    await notify(`Personalize failed: ${prospectId}\n${(err as Error).message}`);
    throw err;
  }
}
