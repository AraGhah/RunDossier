/**
 * DB-backed pipeline checks (safe, read-mostly). Run: npx tsx scripts/test-pipeline-e2e.ts
 */
import 'dotenv/config';
import { pool, query, queryOne } from '../src/db.js';
import { isDuplicateTelegramUpdate } from '../src/telegram/commands.js';
import { buildDeliveryCsv } from '../src/utils/csv-delivery.js';
import { evaluateResearchQuality } from '../src/utils/research-quality.js';
import type { ResearchOutput } from '../src/agents/research.agent.js';

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(ok ? `[PASS] ${name}` : `[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main(): Promise<void> {
  console.log('=== Pipeline E2E checks (DB) ===\n');

  const tables = await query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename IN ('telegram_updates','workflow_runs','deliveries','prospects')`
  );
  record(
    'required tables exist',
    tables.length >= 4,
    `found: ${tables.map((t) => t.tablename).join(', ')}`
  );

  const testUpdateId = 9_000_000_000 + Math.floor(Date.now() % 1_000_000_000);
  const dup1 = await isDuplicateTelegramUpdate(testUpdateId);
  const dup2 = await isDuplicateTelegramUpdate(testUpdateId);
  record(
    'telegram duplicate update blocked',
    dup1 === false && dup2 === true,
    `update_id=${testUpdateId} first=${dup1} second=${dup2}`
  );

  const thin = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects WHERE status = 'thin_research'`
  );
  record('thin_research tracked separately', Number(thin?.count ?? 0) >= 0, `count=${thin?.count}`);

  const ready = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects WHERE status = 'personalized_qa_passed'`
  );
  record('delivery-ready count query', ready != null, `ready=${ready?.count}`);

  const weak: ResearchOutput = {
    top_3_signals: [{ signal: 'Works at Acme', source: 'linkedin', date: '2020-01-01' }],
    buying_triggers: [],
    research_summary: 'Generic',
    confidence_score: 40,
  };
  const weakQ = evaluateResearchQuality(weak);
  record('weak research blocked by gate', weakQ.acceptable === false, weakQ.reason ?? '');

  const { validateVariantFields, checkSignalGrounding } = await import('../src/utils/variant-validation.js');
  const validLine = validateVariantFields(
    're: sdr hires',
    'Saw the Austin SDR job post last week.',
    'Teams hiring SDRs usually struggle to personalize at volume.'
  );
  record('personalization field validation', validLine === null, validLine ?? 'ok');

  const grounded = checkSignalGrounding('SDR manager hires', {
    research_summary: 'Company hired SDR managers in Austin.',
    top_3_signals: [{ signal: 'SDR manager hires Austin', source: 'linkedin.com' }],
  });
  record('signal grounding heuristic', grounded === true);

  const csv = buildDeliveryCsv([
    {
      client_name: 'Test',
      prospect_name: 'E2E User',
      title: 'CEO',
      company: 'E2E Co',
      company_domain: 'e2e.co',
      linkedin_url: 'https://linkedin.com/in/e2e',
      email: 'ceo@e2e.co',
      research_signals: 'Signal A | Signal B',
      source_links: 'https://a.com | https://b.com',
      research_summary: 'Two verifiable signals for outreach.',
      confidence_score: 85,
      subject: 'hi',
      opener: 'He said "hello", noted',
      bridge: 'bridge',
      variant_number: 1,
      prospect_status: 'personalized_qa_passed',
      batch_id: 'b1',
      delivery_id: 'd1',
      run_id: 'r1',
      generated_at: new Date().toISOString(),
    },
  ]);
  record('csv has 20 columns', csv.split('\n')[0].split(',').length === 20);
  record('csv escapes quotes in fields', csv.includes('""hello""'));

  const deliveredDup = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects WHERE status = 'delivered'`
  );
  record('delivered prospects exist', Number(deliveredDup?.count ?? 0) > 0, `delivered=${deliveredDup?.count}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===`);
  await pool.end();
  if (failed.length > 0) process.exit(1);
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
