import { query, queryOne } from '../db.js';
import { runPersonalizeAgent, type FirstLineVariant, type ResearchBrief } from '../agents/personalize.agent.js';
import { runQAAgent, type QABrief, type QAResult } from '../agents/qa.agent.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';

interface Prospect {
  id: string;
  name: string;
  title: string;
  research_summary: string;
  top_3_signals: unknown;
}

function countShipped(variants: FirstLineVariant[], qaResults: QAResult[]): number {
  return variants.filter(v => {
    const qa = qaResults.find(q => q.variant_number === v.variant_number);
    return qa && qa.qa_score >= config.qaScoreFloor;
  }).length;
}

function buildRetryNotes(variants: FirstLineVariant[], qaResults: QAResult[]): string {
  const rejected = variants
    .map(v => {
      const qa = qaResults.find(q => q.variant_number === v.variant_number);
      if (!qa || qa.qa_score >= config.qaScoreFloor) return null;
      return `Variant ${v.variant_number} (${v.angle}): score ${qa.qa_score}/10 — ${qa.qa_reason}`;
    })
    .filter((line): line is string => line !== null);

  if (rejected.length === 0) return '';
  return `\n\nPrevious attempt had rejected variants. Regenerate all 3 with stronger specificity and relevance. Avoid:\n${rejected.join('\n')}`;
}

async function persistVariants(
  prospectId: string,
  variants: FirstLineVariant[],
  qaResults: QAResult[],
  promptId: string
): Promise<number> {
  await query('DELETE FROM first_lines WHERE prospect_id = $1', [prospectId]);

  let shipped = 0;
  for (const variant of variants) {
    const qa = qaResults.find(q => q.variant_number === variant.variant_number);
    const verdict = qa && qa.qa_score >= config.qaScoreFloor ? 'ship' : 'reject';
    if (verdict === 'ship') shipped += 1;

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
        config.personalizeModel, promptId,
        verdict === 'ship' ? 'ready' : 'rejected',
      ]
    );
  }
  return shipped;
}

export async function handlePersonalize(job: { data: { prospectId: string } }): Promise<void> {
  const { prospectId } = job.data;

  try {
    const [prospect] = await query<Prospect>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status IN ('research_complete', 'personalization_in_progress')
       RETURNING id, name, title, research_summary, top_3_signals`,
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

    const brief: ResearchBrief = {
      name: prospect.name,
      title: prospect.title,
      research_summary: prospect.research_summary,
      top_3_signals: prospect.top_3_signals,
    };

    const qaBrief: QABrief = {
      name: prospect.name,
      research_summary: prospect.research_summary,
      top_3_signals: prospect.top_3_signals,
    };

    let retryNotes = '';
    let bestVariants: FirstLineVariant[] = [];
    let bestQa: QAResult[] = [];
    let bestShipped = 0;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      const variants = await runPersonalizeAgent(prospectId, brief, prompt.prompt_text, retryNotes);
      const qaResults = await runQAAgent(prospectId, variants, qaBrief, qaPrompt);
      const shipped = countShipped(variants, qaResults);

      if (shipped > bestShipped) {
        bestVariants = variants;
        bestQa = qaResults;
        bestShipped = shipped;
      }

      if (shipped >= config.variantCount && variants.length >= config.variantCount) {
        bestVariants = variants;
        bestQa = qaResults;
        bestShipped = shipped;
        break;
      }

      retryNotes = buildRetryNotes(variants, qaResults);
    }

    const shipped = await persistVariants(prospectId, bestVariants, bestQa, prompt.id);
    const allPassed = shipped >= config.variantCount && bestVariants.length >= config.variantCount;

    const newStatus = allPassed
      ? 'personalized_qa_passed'
      : shipped > 0
        ? 'research_complete'
        : 'qa_failed';

    await query(
      'UPDATE prospects SET status = $1 WHERE id = $2',
      [newStatus, prospectId]
    );

    await notify(
      allPassed
        ? `Personalize passed: ${prospect.name} (${shipped}/${config.variantCount} ready)`
        : shipped > 0
          ? `Personalize partial: ${prospect.name} (${shipped}/${config.variantCount} ready, retry scheduled)`
          : `Personalize failed: ${prospect.name} (0/${config.variantCount} ready)`
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
