import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function applySql(relativePath: string): Promise<void> {
  const sql = readFileSync(join(root, relativePath), 'utf8');
  await pool.query(sql);
  console.log(`Applied ${relativePath}`);
}

async function main(): Promise<void> {
  validateConfig();
  await applySql('sql/migrations/004_workflow_w2_w5.sql');
  await applySql('sql/seeds/workflow-prompts.sql');
  console.log('Workflow W2–W5 migration complete.');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
