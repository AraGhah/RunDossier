import { config } from './config.js';
import type { ConnectionOptions } from 'tls';

/** Shared SSL options for pg Pool and pg-boss (Node pg ignores NODE_TLS_REJECT_UNAUTHORIZED). */
export function getPgSslConfig(): ConnectionOptions | undefined {
  if (!config.databaseSsl) return undefined;
  return { rejectUnauthorized: config.databaseSslStrict };
}
