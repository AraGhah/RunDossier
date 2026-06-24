import express, { type Request, type Response } from 'express';
import { config } from './config.js';
import { registerDogfoodRoutes } from './routes/dogfood.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerProspectRoutes } from './routes/prospects.js';
import { registerJobRoutes } from './routes/jobs.js';
import { registerTelegramRoutes } from './routes/telegram.js';
import { handlePilotSubmit } from './routes/pilot.js';
import { handleIntakeSubmit } from './routes/intake.js';
import { registerOnboardingRoutes } from './routes/onboarding.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerDeliverabilityRoutes } from './routes/deliverability.js';
import { handleAdminToken, handlePilotToken } from './routes/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { requireJwt } from './middleware/auth.js';
import { securityHeaders } from './middleware/security-headers.js';
import { rateLimit } from './middleware/rate-limit.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { handleSecurityTxt } from './routes/security.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthCache } from './utils/cache.js';

export function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(
    express.json({
      limit: '512kb',
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

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
  const limitIntake = rateLimit({ keyPrefix: 'intake', windowMs: 60_000, max: 10 });
  const limitDogfood = rateLimit({ keyPrefix: 'dogfood', windowMs: 60_000, max: 60 });
  const limitSearch = rateLimit({ keyPrefix: 'search', windowMs: 60_000, max: 30 });
  const limitAdmin = rateLimit({ keyPrefix: 'admin-api', windowMs: 60_000, max: 120 });

  app.get('/health', (_req: Request, res: Response) => {
    const cached = healthCache.get('health');
    if (cached) {
      res.json(cached);
      return;
    }
    const payload = { status: 'ok' as const };
    healthCache.set('health', payload);
    res.json(payload);
  });

  app.get('/.well-known/security.txt', handleSecurityTxt);
  app.get('/security.txt', handleSecurityTxt);

  app.post('/api/auth/token', limitAuthToken, (req, res) => { void handleAdminToken(req, res); });
  app.get('/api/pilot/token', limitPilotToken, (req, res) => { void handlePilotToken(req, res); });
  app.post(
    '/api/pilot',
    limitPilotSubmit,
    requireJwt({ role: 'pilot', audience: 'pilot' }),
    (req, res) => { void handlePilotSubmit(req, res); },
  );

  app.post(
    '/api/intake',
    limitIntake,
    requireJwt({ role: 'admin' }),
    (req, res) => { void handleIntakeSubmit(req, res); },
  );

  registerOnboardingRoutes(app);
  registerDashboardRoutes(app);
  registerDeliverabilityRoutes(app);

  app.use('/dogfood', limitDogfood);
  registerDogfoodRoutes(app);

  app.use('/api/search', limitSearch);
  registerSearchRoutes(app);

  app.use('/api/prospects', limitAdmin);
  app.use('/api/batches', limitAdmin);
  registerProspectRoutes(app);

  app.use('/api/jobs', limitAdmin);
  registerJobRoutes(app);

  registerTelegramRoutes(app);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}

export const app = createApp();
