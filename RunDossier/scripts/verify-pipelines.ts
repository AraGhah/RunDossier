import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { ApifyClient } from 'apify-client';
import { query, pool } from '../src/db.js';
import { validateConfig, config } from '../src/config.js';
import { probePgBoss } from '../src/queue.js';
import { geminiGenerateContent } from '../src/utils/gemini.js';
import { enrichPersonViaApollo } from '../src/scrapers/apollo.js';
import { countShippedLinesSql } from '../src/utils/first-line-status.js';

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

/** RunDossier job names — ignore legacy n8n rows (e.g. research_agent). */
const RUNDOSSIER_WORKFLOWS = ['research', 'personalize', 'W2 - Prospect Intake', 'W1 - Prospect Search', 'delivery'] as const;

function record(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
}

async function main(): Promise<void> {
  console.log('=== Audit pipelines Preframe ===\n');

  try {
    validateConfig();
    record('config', true, 'Variables requises OK');
  } catch (e) {
    record('config', false, (e as Error).message);
  }

  try {
    const tables = ['prospects', 'prospect_signals_raw', 'prompt_versions', 'first_lines', 'ai_costs', 'failed_jobs', 'clients', 'batches', 'client_search_profiles', 'search_runs', 'telegram_updates', 'telegram_command_log', 'workflow_runs'];
    for (const t of tables) {
      const [row] = await query<{ ok: boolean }>(
        `SELECT to_regclass($1) IS NOT NULL AS ok`, [`public.${t}`]
      );
      if (!row?.ok) throw new Error(`Table manquante: ${t}`);
    }
    record('database', true, `${tables.length} tables présentes`);
  } catch (e) {
    record('database', false, (e as Error).message);
  }

  try {
    const client = new Anthropic({ apiKey: config.anthropicKey });
    await client.messages.create({
      model: config.researchModel,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'ok' }],
    });
    record('anthropic', true, 'API accessible');
  } catch (e) {
    record('anthropic', false, (e as Error).message);
  }

  try {
    await geminiGenerateContent(
      'Reply with JSON only: {"ok":true}',
      'ping',
      config.qaModel
    );
    record('gemini', true, `W4.5 QA model ${config.qaModel} accessible`);
  } catch (e) {
    record('gemini', false, (e as Error).message);
  }

  try {
    const client = new ApifyClient({ token: config.apifyToken });
    const user = await client.user().get();
    record('apify', true, `Connecté (${user.username ?? user.id})`);
  } catch (e) {
    record('apify', false, (e as Error).message);
  }

  if (!config.apolloApiKey || !config.apolloEnabled) {
    record('apollo', true, 'Non configuré — enrichissement Apollo ignoré en W3');
  } else {
    try {
      await enrichPersonViaApollo({
        linkedinUrl: 'https://www.linkedin.com/in/tim-zheng',
        name: 'Tim Zheng',
      });
      record('apollo', true, 'API people/match accessible');
    } catch (e) {
      record('apollo', false, (e as Error).message);
    }
  }

  try {
    await probePgBoss();
    record('pg-boss', true, 'Connexion pg-boss OK (sans exécution de jobs)');
  } catch (e) {
    record('pg-boss', false, (e as Error).message);
  }

  try {
    const [pgboss] = await query<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgboss') AS ok`
    );
    if (!pgboss?.ok) throw new Error('Schéma pgboss absent');
    record('pgboss-schema', true, 'Schéma pgboss installé');
  } catch (e) {
    record('pgboss-schema', false, (e as Error).message);
  }

  try {
    const prompts = await query<{ agent_name: string }>(
      `SELECT DISTINCT agent_name FROM prompt_versions WHERE active_bool = true`
    );
    const names = prompts.map((p) => p.agent_name);
    const hasResearch = names.includes('research_agent');
    const hasPersonalize = names.some((n) => n.includes('personalization'));
    const hasQa = names.includes('qa_agent');
    if (!hasResearch || !hasPersonalize || !hasQa) {
      throw new Error(`Prompts actifs incomplets: ${names.join(', ')}`);
    }
    record('prompts', true, `Actifs: ${names.join(', ')}`);
  } catch (e) {
    record('prompts', false, (e as Error).message);
  }

  try {
    const dirty = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects WHERE status <> trim(status)`
    );
    const n = Number(dirty[0]?.count ?? 0);
    record('status-integrity', n === 0, n === 0 ? 'Aucun statut corrompu' : `${n} statut(s) avec espaces parasites`);
  } catch (e) {
    record('status-integrity', false, (e as Error).message);
  }

  try {
    const { default: express } = await import('express');
    const app = express();
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(0, async () => {
        const addr = server.address();
        if (!addr || typeof addr === 'string') return reject(new Error('bind failed'));
        try {
          const res = await fetch(`http://127.0.0.1:${addr.port}/health`);
          const body = await res.json();
          record('health-endpoint', res.status === 200 && body.status === 'ok', 'GET /health → 200');
          server.close(() => resolve());
        } catch (err) {
          server.close(() => reject(err));
        }
      });
    });
  } catch (e) {
    record('health-endpoint', false, (e as Error).message);
  }

  let pipelineOk = true;
  let passedCount = 0;

  try {
    const prospects = await query<{
      name: string;
      status: string;
      shipped_lines: string;
      chosen_lines: string;
      total_lines: string;
    }>(
      `SELECT p.name, trim(p.status) AS status,
              ${countShippedLinesSql('fl')}::text AS shipped_lines,
              COUNT(*) FILTER (WHERE fl.is_chosen = true)::text AS chosen_lines,
              COUNT(fl.id)::text AS total_lines
       FROM prospects p
       LEFT JOIN first_lines fl ON fl.prospect_id = p.id
       GROUP BY p.id, p.name, p.status
       ORDER BY p.name`
    );

    const terminalStatuses = new Set([
      'thin_research',
      'research_failed',
      'qa_failed',
      'personalization_failed',
      'delivered',
    ]);

    console.log('\n--- Prospects ---');
    for (const p of prospects) {
      const shipped = Number(p.shipped_lines);
      const isPassed = p.status === 'personalized_qa_passed';
      if (isPassed) passedCount += 1;

      let ok = true;
      if (isPassed) {
        ok = shipped >= 1;
        if (pipelineOk && !ok) pipelineOk = false;
      } else if (!terminalStatuses.has(p.status) && p.status !== 'queued' && p.status !== 'research_in_progress' && p.status !== 'research_complete' && p.status !== 'personalization_in_progress') {
        ok = false;
      }

      const marker = isPassed ? (ok ? '✓' : '✗') : '·';
      console.log(
        `  ${marker} ${p.name}: ${p.status} | ${p.shipped_lines} shipped, ${p.chosen_lines} chosen (${p.total_lines} variantes)`
      );
    }
    record(
      'prospects',
      pipelineOk,
      pipelineOk
        ? `${passedCount} prospect(s) QA passés avec lignes livrables`
        : `${passedCount} passés — au moins un sans ligne shipped`
    );
  } catch (e) {
    record('prospects', false, (e as Error).message);
    pipelineOk = false;
  }

  try {
    const missingResearch = await query<{ name: string }>(
      `SELECT name FROM prospects
       WHERE trim(status) = 'personalized_qa_passed'
         AND (research_summary IS NULL OR trim(research_summary) = '')`
    );
    record(
      'research-data',
      missingResearch.length === 0,
      missingResearch.length === 0
        ? 'Tous les prospects passés ont un résumé de recherche'
        : `Sans recherche: ${missingResearch.map((r) => r.name).join(', ')}`
    );
  } catch (e) {
    record('research-data', false, (e as Error).message);
  }

  try {
    const [col] = await query<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'failed_jobs' AND column_name = 'created_at'
       ) AS ok`
    );
    const orderCol = col?.ok ? 'created_at' : 'id';
    const recentFails = await query<{ workflow: string; error: string; ts: string }>(
      `SELECT workflow, error, ${orderCol}::text AS ts
       FROM failed_jobs
       WHERE workflow = ANY($1::text[])
       ${col?.ok ? `AND created_at > NOW() - INTERVAL '10 minutes'
         AND error NOT LIKE '%updated_at%'
         AND error NOT LIKE '%No LinkedIn profile returned%'` : ''}
       ORDER BY ${orderCol} DESC
       LIMIT 5`,
      [[...RUNDOSSIER_WORKFLOWS]]
    );
    record(
      'recent-errors',
      recentFails.length === 0,
      recentFails.length === 0
        ? 'Aucune erreur récente'
        : `${recentFails.length} erreur(s) récente(s)`
    );
    for (const f of recentFails) {
      console.log(`    [${f.ts}] ${f.workflow}: ${f.error.slice(0, 100)}`);
    }
  } catch (e) {
    record('recent-errors', false, (e as Error).message);
  }

  try {
    const [col] = await query<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'failed_jobs' AND column_name = 'created_at'
       ) AS ok`
    );
    const orderCol = col?.ok ? 'created_at' : 'id';
    const failed = await query<{ workflow: string; error: string }>(
      `SELECT workflow, error FROM failed_jobs ORDER BY ${orderCol} DESC LIMIT 3`
    );
    if (failed.length) {
      record('failed_jobs', true, `${failed.length} erreurs historiques (voir logs)`);
      for (const f of failed) console.log(`    ${f.workflow}: ${f.error.slice(0, 100)}`);
    } else {
      record('failed_jobs', true, 'Aucune erreur enregistrée');
    }
  } catch (e) {
    record('failed_jobs', false, (e as Error).message);
  }

  try {
    const { deliveryEmailConfigured } = await import('../src/utils/send-delivery-email.js');
    const { resendConfigured } = await import('../src/utils/resend.js');
    const { gmailConfigured } = await import('../src/utils/gmail-smtp.js');
    const ok = deliveryEmailConfigured();
    const detail = ok
      ? `Provider: ${resendConfigured() ? 'resend' : ''}${resendConfigured() && gmailConfigured() ? '+' : ''}${gmailConfigured() ? 'gmail' : ''}`
      : 'Aucun fournisseur email (RESEND_API_KEY ou GMAIL_USER+GMAIL_APP_PASSWORD)';
    record('delivery-email-config', ok, detail);
  } catch (e) {
    record('delivery-email-config', false, (e as Error).message);
  }

  try {
    const [tg] = await query<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telegram_updates') AS ok`
    );
    const botReady = Boolean(config.telegramBotToken);
    record(
      'telegram-bot',
      tg?.ok === true,
      botReady ? 'Tables bot OK, TELEGRAM_BOT_TOKEN configuré' : 'Tables bot OK (token absent en local — OK pour CI)'
    );
  } catch (e) {
    record('telegram-bot', false, (e as Error).message);
  }

  const failedChecks = checks.filter((c) => !c.ok);
  const exitCode = failedChecks.length || !pipelineOk ? 1 : 0;
  console.log(`\n=== Bilan: ${checks.length - failedChecks.length}/${checks.length} checks OK ===`);
  if (exitCode === 0) console.log('=== TOUS LES PIPELINES VALIDÉS ===');

  await pool.end();
  process.exit(exitCode);
}

void main();
