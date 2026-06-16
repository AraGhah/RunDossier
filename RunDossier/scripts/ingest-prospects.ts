/**
 * W2 — Prospect Intake: validate, dedupe per client, batch by 50, queue for research.
 *
 * Usage:
 *   npx tsx scripts/ingest-prospects.ts prospects.json
 *   npx tsx scripts/ingest-prospects.ts --stdin
 *   npx tsx scripts/ingest-prospects.ts prospects.json --client-id <uuid>
 *
 * JSON format:
 * [
 *   {
 *     "name": "Jane Doe",
 *     "linkedin_url": "https://www.linkedin.com/in/janedoe",
 *     "email": "jane@acme.com",
 *     "title": "VP Sales",
 *     "company": "Acme",
 *     "client_id": "optional-uuid"
 *   }
 * ]
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import {
  ingestProspects,
  normalizeIntakeRecord,
  DEFAULT_CLIENT_ID,
  type IntakeRecord,
} from '../src/services/intake.js';

function parseInput(raw: string, defaultClientId: string): IntakeRecord[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Input must be a JSON array of prospects');
  }
  return data.map((row, i) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`Row ${i + 1}: invalid object`);
    }
    const record = normalizeIntakeRecord(row as Record<string, unknown>);
    if (!record.client_id || record.client_id === DEFAULT_CLIENT_ID) {
      record.client_id = defaultClientId;
    }
    return record;
  });
}

async function main(): Promise<void> {
  validateConfig();

  const args = process.argv.slice(2);
  const clientFlag = args.indexOf('--client-id');
  const defaultClientId =
    clientFlag >= 0 && args[clientFlag + 1]
      ? args[clientFlag + 1]
      : DEFAULT_CLIENT_ID;

  const fileArg = args.find(a => a !== '--stdin' && a !== '--client-id' && !a.startsWith('--'));
  if (!fileArg && !args.includes('--stdin')) {
    console.error('Usage: npx tsx scripts/ingest-prospects.ts <fichier.json> [--client-id <uuid>]');
    console.error('       npx tsx scripts/ingest-prospects.ts --stdin [--client-id <uuid>]');
    process.exit(1);
  }

  const raw =
    args.includes('--stdin')
      ? await new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          process.stdin.on('data', (c) => chunks.push(c));
          process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          process.stdin.on('error', reject);
        })
      : readFileSync(fileArg!, 'utf8');

  const records = parseInput(raw, defaultClientId);
  console.log(`W2 Intake: ${records.length} enregistrement(s), client ${defaultClientId}\n`);

  const result = await ingestProspects(records);
  console.log(`  insérés : ${result.inserted}`);
  console.log(`  ignorés (doublon) : ${result.skipped}`);
  console.log(`  invalides : ${result.invalid}`);
  console.log(`  lots : ${result.batchIds.join(', ') || '—'}`);

  if (result.inserted > 0) {
    console.log('\nLe scheduler (*/5 min) lancera W3 research puis W4/W4.5 personalize+QA.');
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
