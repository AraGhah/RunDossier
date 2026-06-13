import express, { type Request, type Response, type NextFunction } from 'express';
import { config, validateConfig } from './config.js';
import { startQueue, stopQueue } from './queue.js';
import { notify } from './notify.js';
import { pool } from './db.js';

const app = express();

// Limit body size to prevent memory-exhaustion via large payloads
app.use(express.json({ limit: '64kb' }));

// Minimal security headers (no external dependencies)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // modern browsers ignore it; CSP is the real guard
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.removeHeader('X-Powered-By');
  next();
});

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Explicit 404 for all other routes — avoid leaking route structure
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

let server: ReturnType<typeof app.listen> | undefined;

async function shutdown(signal: string): Promise<void> {
  console.log(`[shutdown] ${signal} received — shutting down gracefully`);
  try {
    await notify(`Preframe shutting down (${signal})`).catch(() => {});
    server?.close();
    await stopQueue();
    await pool.end();
  } catch (err) {
    console.error('[shutdown] Error during shutdown:', err);
  }
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    validateConfig();
    await startQueue();
    server = app.listen(config.port, () => {
      console.log(`[main] Preframe running on :${config.port}`);
    });
    await notify('Preframe service started');
  } catch (err) {
    console.error('[main] Fatal startup error:', err);
    try {
      await notify(`FATAL: Preframe failed to start: ${(err as Error).message}`);
    } catch {
      // secondary notify failure is acceptable
    }
    process.exit(1);
  }
}

process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
process.once('SIGINT',  () => { void shutdown('SIGINT'); });

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  void shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  void shutdown('unhandledRejection');
});

void main();
