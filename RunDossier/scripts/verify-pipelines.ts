import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { ApifyClient } from 'apify-client';
import { query, pool } from '../src/db.js';
import { validateConfig, config } from '../src/config.js';
import { probePgBoss } from '../src/queue.js';

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

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
    const tables = ['prospects', 'prospect_signals_raw', 'prompt_versions', 'first_lines', 'ai_costs', 'failed_jobs'];
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
    const client = new ApifyClient({ token: config.apifyToken });
    const user = await client.user().get();
    record('apify', true, `Connecté (${user.username ?? user.id})`);
  } catch (e) {
    record('apify', false, (e as Error).message);
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
    if (!hasResearch || !hasPersonalize) {
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

  const prospects = await query<{
    name: string;
    status: string;
    ready_lines: string;
    total_lines: string;
  }>(
    `SELECT p.name, trim(p.status) AS status,
            COUNT(*) FILTER (WHERE fl.status = 'ready')::text AS ready_lines,
            COUNT(fl.id)::text AS total_lines
     FROM prospects p
     LEFT JOIN first_lines fl ON fl.prospect_id = p.id
     GROUP BY p.id, p.name, p.status
     ORDER BY p.name`
  );

  console.log('\n--- Prospects ---');
  const expectedVariants = config.variantCount;
  let allPassed = true;
  for (const p of prospects) {
    const ready = Number(p.ready_lines);
    const ok =
      p.status === 'personalized_qa_passed' &&
      ready >= expectedVariants &&
      Number(p.total_lines) >= expectedVariants;
    if (!ok) allPassed = false;
    console.log(
      `  ${ok ? '✓' : '✗'} ${p.name}: ${p.status} | ${p.ready_lines}/${expectedVariants} lignes prêtes (${p.total_lines} variantes)`
    );
  }
  record(
    'prospects',
    allPassed,
    allPassed
      ? `${prospects.length} prospects, tous ${expectedVariants}/${expectedVariants}`
      : `${prospects.length} prospects — exiger ${expectedVariants}/${expectedVariants} ready`
  );

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
    const recentFails = await query<{ workflow: string; error: string; created_at: string }>(
      `SELECT workflow, error, created_at::text
       FROM failed_jobs
       WHERE created_at > NOW() - INTERVAL '10 minutes'
         AND error NOT LIKE '%updated_at%'
       ORDER BY created_at DESC`
    );
    record(
      'recent-errors',
      recentFails.length === 0,
      recentFails.length === 0
        ? 'Aucune erreur récente (10 min)'
        : `${recentFails.length} erreur(s) récente(s)`
    );
    for (const f of recentFails) {
      console.log(`    [${f.created_at}] ${f.workflow}: ${f.error.slice(0, 100)}`);
    }
  } catch (e) {
    record('recent-errors', false, (e as Error).message);
  }

  const failed = await query<{ workflow: string; error: string }>(
    `SELECT workflow, error FROM failed_jobs ORDER BY created_at DESC LIMIT 3`
  );
  if (failed.length) {
    record('failed_jobs', true, `${failed.length} erreurs historiques (voir logs)`);
    for (const f of failed) console.log(`    ${f.workflow}: ${f.error.slice(0, 100)}`);
  } else {
    record('failed_jobs', true, 'Aucune erreur enregistrée');
  }

  const failedChecks = checks.filter((c) => !c.ok);
  const exitCode = failedChecks.length || !allPassed ? 1 : 0;
  console.log(`\n=== Bilan: ${checks.length - failedChecks.length}/${checks.length} checks OK ===`);
  if (exitCode === 0) console.log('=== TOUS LES PIPELINES VALIDÉS ===');

  await pool.end();
  process.exit(exitCode);
}

void main();
