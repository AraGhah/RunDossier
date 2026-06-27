#!/usr/bin/env tsx
import 'dotenv/config';
import { pool, query } from '../src/db.js';

const FAILED_ID = '3ed364b9-7cc6-432d-a279-7f5f87ed1718';

async function main(): Promise<void> {
  const statuses = await query(
    `SELECT p.status, count(*)::int AS n
     FROM deliveries d
     JOIN prospects p ON p.id = ANY(d.prospect_ids)
     WHERE d.id = $1
     GROUP BY p.status`,
    [FAILED_ID]
  );
  const sample = await query(
    `SELECT p.id, p.name, p.status, p.delivered_at
     FROM deliveries d
     JOIN prospects p ON p.id = ANY(d.prospect_ids)
     WHERE d.id = $1
     LIMIT 5`,
    [FAILED_ID]
  );
  console.log(JSON.stringify({ failed_delivery_id: FAILED_ID, prospect_statuses: statuses, sample }, null, 2));
  await pool.end();
}

void main();
