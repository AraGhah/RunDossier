#!/usr/bin/env tsx
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../src/db.js';
import { config, validateConfig } from '../src/config.js';

async function main(): Promise<void> {
  validateConfig();
  const sql = readFileSync(join(process.cwd(), 'sql/migrations/007_prospect_search.sql'), 'utf8');
  await pool.query(sql).catch((e) => {
    if (!/already exists/i.test((e as Error).message)) throw e;
  });
  console.log('Applied 007_prospect_search.sql');
  console.log('sales_nav_url_set:', Boolean(config.apifySalesNavSearchUrl));
  await pool.end();
}
void main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
