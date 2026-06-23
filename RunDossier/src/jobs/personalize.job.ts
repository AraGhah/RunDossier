import { query, queryOne } from '../db.js';
import { runPersonalizeAgent, type FirstLineVariant, type ResearchBrief } from '../agents/personalize.agent.js';
import { LLMJsonParseError } from '../utils/parse-json.js';
import { runQAAgent, pickBestVariant, passesW45Criteria, maxQaScore, type QABrief, type QAResult } from '../agents/qa.agent.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { effectivePerProspectCapUsd } from '../utils/cost-governor.js';
import { loadActivePrompt } from '../utils/prompts.js';
import { logFunnelEvent } from '../utils/funnel-log.js';
import { maybeRunDeliveryForClient } from '../utils/delivery-trigger.js';

// --- Workflow 4 escalation config (override via env) ---------------------------
// Generation ladder: cheap model first, escalate only when QA rejects the batch.
const LADDER: string[] = (process.env.PERSONALIZE_LADDER
  ? process.env.PERSONALIZE_LADDER.split(',').map((s) => s.trim()).filter(Boolean)
  : ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8']);
// QA judge — Gemini, deliberately a different model family than the generators.
const QA_PRIMARY = process.env.QA_MODEL_PRIMARY?.trim() || 'gemini-2.0-flash';
const QA_FALLBACK = process.env.QA_MODEL_FALLBACK?.trim() || 'gemini-2.5-pro';
// Hard per-prospect retry budget. effectivePerProspectCapUsd() clamps to a $0.25
// ceiling — PER_PROSPECT_COST_CAP can only LOWER it (tests), never bypass it upward.
const COST_CAP_USD = effectivePerProspectCapUsd();
const MAX_REGENERATIONS = Number(process.env.MAX_REGENERATIONS || String(LADDER.length)) || LADDER.length;

interface Prospect {
  id: string;
  name: string;
  title: string;
  company: string | null;
  client_id: string | null;
  research_summary: string;
  top_3_signals: unknown;
  buying_triggers?: unknown;
  source?: string;
}

/** Cumulative AI spend logged against this prospect (research + personalize + QA). */
async function prospectCostUsd(prospectId: string): Promise<number> {
  const row = await queryOne<{ c: string }>(
    `SELECT COALESCE(SUM(cost_usd), 0)::text AS c FROM ai_costs WHERE prospect_id = $1`,
    [prospectId]
  );
  return Number(row?.c ?? 0);
}

function buildRetryNotes(variants: FirstLineVariant[], qaResults: QAResult[]): string {
  const rejected = variants
    .map((v) => {
      const qa = qaResults.find((q) => q.variant_number === v.variant_number);
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
  promptId: string,
  modelUsed: string
): Promise<{ passed: boolean; chosenVariant: number | null }> {
  await query('DELETE FROM first_lines WHERE prospect_id = $1', [prospectId]);

  const best = pickBestVariant(variants, qaResults);

  for (const variant of variants) {
    const qa = qaResults.find((q) => q.variant_number === variant.variant_number);
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
        modelUsed, promptId,
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
      `UPDATE prospects SET status = 'personalization_in_progress', updated_at = NOW()
       WHERE id = $1 AND status IN ('research_complete', 'qa_failed', 'personalization_failed')
       RETURNING id, name, title, company, client_id, research_summary, top_3_signals,
                 buying_triggers, COALESCE(source, 'manual') AS source`,
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
      buying_triggers: prospect.buying_triggers,
    };
    const qaBrief: QABrief = {
      name: prospect.name,
      title: prospect.title,
      company: prospect.company ?? undefined,
      research_summary: prospect.research_summary,
      top_3_signals: prospect.top_3_signals,
    };

    const baselineCost = await prospectCostUsd(prospectId);
    const ladder = LADDER.slice(0, MAX_REGENERATIONS);

    let retryNotes = '';
    let bestVariants: FirstLineVariant[] = [];
    let bestQa: QAResult[] = [];
    let bestModel = ladder[0];
    let bestMaxScore = -1;
    let lastError: Error | null = null;
    let lastRawOutput = '';
    let costStopped = false;

    for (let i = 0; i < ladder.length; i++) {
      const model = ladder[i];
      const spent = (await prospectCostUsd(prospectId)) - baselineCost;
      if (spent >= COST_CAP_USD) {
        console.warn(`[personalize] ${prospectId} cost cap reached ($${spent.toFixed(3)} >= $${COST_CAP_USD}) before rung ${i + 1} (${model}) — stopping ladder`);
        costStopped = true;
        break;
      }

      console.log(`[personalize] ${prospectId} rung ${i + 1}/${ladder.length} generate=${model} qa=${QA_PRIMARY} spent=$${spent.toFixed(3)}`);
      try {
        const variants = await runPersonalizeAgent(prospectId, brief, prompt.prompt_text, retryNotes, model);
        const qaResults = await runQAAgent(prospectId, variants, qaBrief, qaPrompt, QA_PRIMARY, QA_FALLBACK);
        const pick = pickBestVariant(variants, qaResults);
        const attemptMax = maxQaScore(qaResults);
        console.log(`[personalize] ${prospectId} rung ${i + 1} (${model}) -> QA max ${attemptMax}/10, ship=${pick ? 'YES' : 'no'}`);

        if (attemptMax > bestMaxScore) {
          bestVariants = variants;
          bestQa = qaResults;
          bestModel = model;
          bestMaxScore = attemptMax;
        }

        if (pick) {
          const { chosenVariant } = await persistVariants(prospectId, variants, qaResults, prompt.id, model);
          await query(`UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW() WHERE id = $1`, [prospectId]);
          const total = (await prospectCostUsd(prospectId)) - baselineCost;
          await notify(`W4 shipped: ${prospect.name} via ${model} (variant ${chosenVariant}, QA ${pick.qa.qa_score}/10, $${total.toFixed(3)})`);
          if (prospect.source === 'dogfood') {
            await logFunnelEvent(prospectId, 'personalized', { chosenVariant, model });
          }
          if (prospect.client_id) {
            try {
              await maybeRunDeliveryForClient(prospect.client_id);
            } catch (deliveryErr) {
              console.error('[personalize] delivery trigger error:', deliveryErr);
            }
          }
          return;
        }

        const escalation =
          i + 1 < ladder.length
            ? `\n\nThe independent QA judge rejected every variant. A stronger model will now retry — push specificity and human-ness above ${config.qaScoreFloor}/10 and anchor each line on a different concrete signal.`
            : '';
        retryNotes = buildRetryNotes(variants, qaResults) + escalation;
      } catch (attemptErr) {
        lastError = attemptErr as Error;
        if (attemptErr instanceof LLMJsonParseError) lastRawOutput = attemptErr.raw;
        console.warn(`[personalize] ${prospectId} rung ${i + 1} (${model}) errored: ${lastError.message}`);
        retryNotes =
          '\n\nIMPORTANT: Return ONLY valid JSON with a "variants" array of exactly 3 objects — no markdown, no code fences, no prose.';
      }
    }

    // Ladder exhausted (or cost-capped) with no shipping variant -> terminal dead-letter.
    if (bestVariants.length > 0) {
      await persistVariants(prospectId, bestVariants, bestQa, prompt.id, bestModel);
    }
    const totalSpent = (await prospectCostUsd(prospectId)) - baselineCost;
    const reason = costStopped
      ? `cost cap $${COST_CAP_USD} reached ($${totalSpent.toFixed(3)})`
      : `no variant met ship criteria after ladder [${ladder.join(' -> ')}] (best QA ${Math.max(0, bestMaxScore)}/10, $${totalSpent.toFixed(3)})`;

    if (lastRawOutput) {
      await query(
        `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
         VALUES ('personalize-raw-output', $1, $2, $3)`,
        [prospectId, `raw model output (${lastRawOutput.length} chars): ${lastRawOutput.slice(0, 4000)}`, ladder.length]
      ).catch((e) => console.error('[personalize] raw output log error:', e));
    }
    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('personalize-dead-letter', $1, $2, $3)`,
      [prospectId, `dead-lettered: ${reason}${lastError ? ' | last error: ' + lastError.message : ''}`, ladder.length]
    ).catch((e) => console.error('[personalize] dead-letter log error:', e));

    await query(`UPDATE prospects SET status = 'dead_letter', updated_at = NOW() WHERE id = $1`, [prospectId]);
    await notify(`W4 dead-letter: ${prospect.name} — ${reason}`);
  } catch (err) {
    // Genuine infra/exception (DB, missing prompt, etc.) -> retryable, not dead-letter.
    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('personalize', $1, $2, $3)`,
      [prospectId, (err as Error).message, MAX_REGENERATIONS]
    ).catch((e) => console.error('[personalize] failed_jobs insert error:', e));

    await query(
      `UPDATE prospects SET status = 'personalization_failed'
       WHERE id = $1 AND status = 'personalization_in_progress'`,
      [prospectId]
    ).catch((e) => console.error('[personalize] status reset error:', e));

    await notify(`Personalize errored: ${prospectId}\n${(err as Error).message}`);
    throw err;
  }
}
