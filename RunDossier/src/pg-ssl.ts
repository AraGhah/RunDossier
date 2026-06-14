import { config } from './config.js';
import type { ConnectionOptions } from 'tls';

/** Shared SSL options for pg Pool and pg-boss (Node pg ignores NODE_TLS_REJECT_UNAUTHORIZED). */
export function getPgSslConfig(): ConnectionOptions | undefined {
  if (!config.databaseSsl) return undefined;
  return { rejectUnauthorized: config.databaseSslStrict };
}

export function logDatabaseSslConfig(): void {
  const host = (() => {
    try {
      return new URL(config.databaseUrl.replace(/^postgresql:/, 'http:')).hostname;
    } catch {
      return '(invalid DATABASE_URL)';
    }
  })();
  console.log(
    `[db] SSL enabled=${config.databaseSsl} strict=${config.databaseSslStrict} host=${host}`
  );
}
