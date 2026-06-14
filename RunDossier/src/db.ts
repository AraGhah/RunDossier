import { Pool } from 'pg';
import { config } from './config.js';
import { getPgSslConfig } from './pg-ssl.js';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: getPgSslConfig(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  options: '-c statement_timeout=30000',
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool client error:', err);
});

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(sql, params as unknown[]);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
