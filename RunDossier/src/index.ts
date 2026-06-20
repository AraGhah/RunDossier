import { config, validateConfig } from './config.js';
import { app } from './app.js';
import { startQueue, stopQueue } from './queue.js';
import { startTelegramPolling, stopTelegramPolling } from './telegram/polling.js';
import { notify } from './notify.js';
import { pool } from './db.js';
import { logger } from './utils/logger.js';

let server: ReturnType<typeof app.listen> | undefined;

async function shutdown(signal: string): Promise<void> {
  logger.warn('shutdown_started', { signal });
  try {
    await notify(`Preframe shutting down (${signal})`).catch(() => {});
    server?.close();
    await stopQueue();
    stopTelegramPolling();
    await pool.end();
  } catch (err) {
    logger.error('shutdown_error', { error: (err as Error).message });
  }
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    validateConfig();
    await startQueue();
    startTelegramPolling();
    server = app.listen(config.port, () => {
      logger.info('server_started', { port: config.port });
    });
    await notify('Preframe service started');
  } catch (err) {
    logger.error('fatal_startup', { error: (err as Error).message });
    try {
      await notify(`FATAL: Preframe failed to start: ${(err as Error).message}`);
    } catch {
      // secondary notify failure is acceptable
    }
    process.exit(1);
  }
}

process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
process.once('SIGINT', () => { void shutdown('SIGINT'); });

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { error: err.message });
  void shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: String(reason) });
  void shutdown('unhandledRejection');
});

void main();
