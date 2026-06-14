import { query, queryOne } from '../db.js';
import { runPersonalizeAgent, type FirstLineVariant, type ResearchBrief } from '../agents/personalize.agent.js';
import { runQAAgent, pickBestVariant, passesW45Criteria, type QABrief, type QAResult } from '../agents/qa.agent.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';
import { logFunnelEvent } from '../utils/funnel-log.js';
import { maybeRunDeliveryForClient } from '../utils/delivery-trigger.js';

interface Prospect {
  id: string;
  name: string;
  title: string;
  company: string | null;
  client_id: string | null;
  research_summary: string;
  top_3_signals: unknown;
  source?: string;
}

function buildRetryNotes(variants: FirstLineVariant[], qaResults: QAResult[]): string {
  const rejected = variants
    .map(v => {
      const qa = qaResults.find(q => q.variant_number === v.variant_number);
      if (!qa || passesW45Criteria(qa)) return null;
      return `Variant ${v.variant_number} (${v.signal_used}): score ${qa.qa_score}/10 — ${qa.qa_reason}`;
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
): Promise<{ passed: boolean; chosenVariant: number | null }> {
  await query('DELETE FROM first_lines WHERE prospect_id = $1', [prospectId]);

  const best = pickBestVariant(variants, qaResults);

  for (const variant of variants) {
    const qa = qaResults.find(q => q.variant_number === variant.variant_number);
    const passed = qa ? passesW45Criteria(qa) : false;
    const isChosen = best?.variant.variant_number === variant.variant_number;

    await query(
      `INSERT INTO first_lines
       (prospect_id, variant_number, subject, opener, bridge, angle, signal_used,
        qa_score, specificity_score, human_ness_score, relevance_score, length_ok,
        grounded, qa_verdict, qa_reason, model_used, prompt_version_id, status,
        is_chosen, qa_created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())`,
      [
        prospectId, variant.variant_number,
        variant.subject, variant.opener, variant.bridge, variant.signal_used, variant.signal_used,
        qa?.qa_score ?? 0, qa?.specificity_score ?? 0,
        qa?.human_ness_score ?? 0, qa?.relevance_score ?? 0,
        qa?.length_ok ?? false, qa?.grounded ?? false,
        qa?.qa_verdict ?? 'reject', qa?.qa_reason ?? '',
        config.qaModel, promptId,
        passed ? 'qa_passed' : 'qa_failed',
        isChosen,
      ]
    );
  }

  return {
    passed: best !== null,
    chosenVariant: best?.variant.variant_number ?? null,
  };
}

export async function handlePersonalize(job: { data: { prospectId: string } }): Promise<void> {
  const { prospectId } = job.data;

  try {
    const [prospect] = await query<Prospect>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status IN ('research_complete', 'personalization_in_progress')
       RETURNING id, name, title, company, client_id, research_summary, top_3_signals,
                 COALESCE(source, 'manual') AS source`,
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
      'You are an independent QA reviewer for Preframe cold-email first lines. Score honestly. Return only valid JSON.'
    );

    const brief: ResearchBrief = {
      name: prospect.name,
      title: prospect.title,
      company: prospect.company ?? undefined,
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
    let bestPick: ReturnType<typeof pickBestVariant> = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      const variants = await runPersonalizeAgent(prospectId, brief, prompt.prompt_text, retryNotes);
      const qaResults = await runQAAgent(prospectId, variants, qaBrief, qaPrompt);
      const pick = pickBestVariant(variants, qaResults);

      if (pick && (!bestPick || pick.qa.qa_score > bestPick.qa.qa_score)) {
        bestVariants = variants;
        bestQa = qaResults;
        bestPick = pick;
      }

      if (pick && pick.qa.qa_score >= config.qaScoreFloor) {
        bestVariants = variants;
        bestQa = qaResults;
        bestPick = pick;
        break;
      }

      retryNotes = buildRetryNotes(variants, qaResults);
    }

    if (bestVariants.length === 0) {
      throw new Error('Personalization produced no variants after retries');
    }

    const { passed, chosenVariant } = await persistVariants(
      prospectId,
      bestVariants,
      bestQa,
      prompt.id
    );

    const newStatus = passed ? 'personalized_qa_passed' : 'qa_failed';

    await query('UPDATE prospects SET status = $1 WHERE id = $2', [newStatus, prospectId]);

    await notify(
      passed
        ? `W4/W4.5 passed: ${prospect.name} (chosen variant ${chosenVariant})`
        : `W4/W4.5 failed: ${prospect.name} (no variant met ship criteria)`
    );

    if (passed && prospect.source === 'dogfood') {
      await logFunnelEvent(prospectId, 'personalized', { chosenVariant });
    }

    if (passed && prospect.client_id) {
      try {
        await maybeRunDeliveryForClient(prospect.client_id);
      } catch (deliveryErr) {
        console.error('[personalize] delivery trigger error:', deliveryErr);
      }
    }

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
