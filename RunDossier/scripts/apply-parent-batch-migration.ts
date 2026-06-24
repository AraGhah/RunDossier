import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function apply(file: string): Promise<void> {
  const sql = readFileSync(join(root, 'sql/migrations', file), 'utf8');
  await pool.query(sql);
  console.log(`Applied ${file}`);
}

async function main(): Promise<void> {
  await apply('027_parent_batch_orchestration.sql');
  await apply('028_parent_batch_hardening.sql');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
