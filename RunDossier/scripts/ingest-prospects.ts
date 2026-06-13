/**
 * Insert prospects with status 'queued' for the research → personalize pipeline.
 *
 * Usage:
 *   npx tsx scripts/ingest-prospects.ts prospects.json
 *   npx tsx scripts/ingest-prospects.ts --stdin   (JSON array on stdin)
 *
 * JSON format:
 * [
 *   { "name": "Jane Doe", "linkedin_url": "https://www.linkedin.com/in/janedoe", "title": "...", "company": "..." }
 * ]
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?(\?[^\s]*)?$/;

export interface ProspectInput {
  name: string;
  linkedin_url: string;
  title?: string;
  company?: string;
}

function normalizeLinkedInUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  url = url.replace(/^http:\/\//i, 'https://');
  try {
    const parsed = new URL(url);
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.replace(/^linkedin\.com$/i, 'www.linkedin.com');
    parsed.hash = '';
    const path = parsed.pathname.replace(/\/+$/, '') || parsed.pathname;
    return `https://www.linkedin.com${path.startsWith('/') ? path : `/${path}`}${parsed.search}`;
  } catch {
    return url;
  }
}

function parseInput(raw: string): ProspectInput[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Input must be a JSON array of prospects');
  }
  return data.map((row, i) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`Row ${i + 1}: invalid object`);
    }
    const r = row as Record<string, unknown>;
    const name = String(r.name ?? '').trim();
    const linkedin_url = normalizeLinkedInUrl(String(r.linkedin_url ?? ''));
    if (!name) throw new Error(`Row ${i + 1}: name is required`);
    if (!LINKEDIN_PROFILE_RE.test(linkedin_url)) {
      throw new Error(`Row ${i + 1}: invalid LinkedIn URL — ${linkedin_url}`);
    }
    return {
      name,
      linkedin_url,
      title: r.title != null ? String(r.title).trim() || undefined : undefined,
      company: r.company != null ? String(r.company).trim() || undefined : undefined,
    };
  });
}

async function ingest(prospects: ProspectInput[]): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const p of prospects) {
    const [existing] = await query<{ id: string; status: string }>(
      `SELECT id, status FROM prospects WHERE linkedin_url = $1 LIMIT 1`,
      [p.linkedin_url]
    );
    if (existing) {
      console.log(`  skip  ${p.name} — déjà en base (${existing.status})`);
      skipped += 1;
      continue;
    }

    const [row] = await query<{ id: string }>(
      `INSERT INTO prospects (name, title, linkedin_url, status)
       VALUES ($1, $2, $3, 'queued')
       RETURNING id`,
      [p.name, p.title ?? null, p.linkedin_url]
    );
    console.log(`  added ${p.name} → ${row?.id} (queued)`);
    inserted += 1;
  }

  console.log(`\nRésumé: ${inserted} ajouté(s), ${skipped} ignoré(s).`);
  if (inserted > 0) {
    console.log('Le scheduler (toutes les 5 min) lancera research puis personalize si le service tourne.');
  }
}

async function main(): Promise<void> {
  validateConfig();

  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npx tsx scripts/ingest-prospects.ts <fichier.json>');
    console.error('       npx tsx scripts/ingest-prospects.ts --stdin');
    process.exit(1);
  }

  const raw =
    arg === '--stdin'
      ? await new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          process.stdin.on('data', (c) => chunks.push(c));
          process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          process.stdin.on('error', reject);
        })
      : readFileSync(arg, 'utf8');

  const prospects = parseInput(raw);
  console.log(`Ingestion de ${prospects.length} profil(s)…\n`);
  await ingest(prospects);
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
