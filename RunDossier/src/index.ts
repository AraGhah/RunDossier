import express, { type Request, type Response } from 'express';
import { config, validateConfig } from './config.js';
import { startQueue, stopQueue } from './queue.js';
import { notify } from './notify.js';
import { pool } from './db.js';
import { registerDogfoodRoutes } from './routes/dogfood.js';
import { handlePilotSubmit } from './routes/pilot.js';
import { handleAdminToken, handlePilotToken } from './routes/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { requireJwt } from './middleware/auth.js';
import { securityHeaders } from './middleware/security-headers.js';
import { rateLimit } from './middleware/rate-limit.js';

const app = express();

if (config.trustProxy) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json({ limit: '16kb' }));

const limitAuthToken = rateLimit({ keyPrefix: 'auth-token', windowMs: 15 * 60_000, max: 10 });
const limitPilotToken = rateLimit({ keyPrefix: 'pilot-token', windowMs: 60_000, max: 20 });
const limitPilotSubmit = rateLimit({
  keyPrefix: 'pilot-submit',
  windowMs: 60 * 60_000,
  max: 5,
  keySuffix: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    return email ? email.slice(0, 64) : '';
  },
});
const limitDogfood = rateLimit({ keyPrefix: 'dogfood', windowMs: 60_000, max: 60 });

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.post('/api/auth/token', limitAuthToken, (req, res) => { void handleAdminToken(req, res); });
app.get('/api/pilot/token', limitPilotToken, (req, res) => { void handlePilotToken(req, res); });
app.post(
  '/api/pilot',
  limitPilotSubmit,
  requireJwt({ role: 'pilot', audience: 'pilot' }),
  (req, res) => { void handlePilotSubmit(req, res); }
);

app.use('/dogfood', limitDogfood);
registerDogfoodRoutes(app);

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
