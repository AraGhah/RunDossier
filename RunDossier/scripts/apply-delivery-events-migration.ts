import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(root, 'sql/migrations/030_delivery_events_sending.sql'), 'utf8');

await pool.query(sql);
console.log('Applied 030_delivery_events_sending.sql');
await pool.end();
