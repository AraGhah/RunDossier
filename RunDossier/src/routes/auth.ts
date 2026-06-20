import type { Request, Response } from 'express';
import { config } from '../config.js';
import { signAppToken } from '../utils/jwt.js';
import { secureCompare } from '../utils/secure-compare.js';
import { isAllowedBrowserOrigin } from '../utils/origin-check.js';
import {
  clearAuthFailures,
  isAuthLocked,
  recordAuthFailure,
} from '../middleware/auth-lockout.js';
import { writeAuditEvent } from '../utils/audit-log.js';
import { clientIp } from '../utils/safe-error.js';
import type { RequestWithId } from '../middleware/request-id.js';

interface TokenBody {
  apiKey?: unknown;
}

export async function handleAdminToken(req: Request, res: Response): Promise<void> {
  if (!config.jwtSecret || !config.jwtApiKey) {
    res.status(503).json({ error: 'Admin auth not configured' });
    return;
  }

  const ip = clientIp(req);
  const lock = isAuthLocked(ip);
  if (lock.locked) {
    res.setHeader('Retry-After', String(lock.retryAfterSec ?? 900));
    res.status(429).json({ error: 'Too many failed authentication attempts' });
    void writeAuditEvent({
      requestId: (req as RequestWithId).requestId,
      action: 'auth.lockout',
      ip,
      metadata: { retryAfterSec: lock.retryAfterSec },
    });
    return;
  }

  const body = req.body as TokenBody;
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  if (!apiKey || !secureCompare(apiKey, config.jwtApiKey)) {
    const failure = recordAuthFailure(ip);
    void writeAuditEvent({
      requestId: (req as RequestWithId).requestId,
      action: failure.locked ? 'auth.lockout_triggered' : 'auth.failed',
      ip,
    });
    if (failure.locked) {
      res.setHeader('Retry-After', String(failure.retryAfterSec ?? 900));
      res.status(429).json({ error: 'Too many failed authentication attempts' });
      return;
    }
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  clearAuthFailures(ip);
  void writeAuditEvent({
    requestId: (req as RequestWithId).requestId,
    action: 'auth.success',
    actorRole: 'admin',
    actorSub: 'admin',
    ip,
  });

  const token = await signAppToken(
    { sub: 'admin', role: 'admin' },
    config.jwtExpiresIn
  );

  res.json({ token, expiresIn: config.jwtExpiresIn, role: 'admin' });
}

export async function handlePilotToken(req: Request, res: Response): Promise<void> {
  if (!config.jwtSecret) {
    res.status(503).json({ error: 'JWT not configured' });
    return;
  }

  if (!isAllowedBrowserOrigin(req)) {
    void writeAuditEvent({
      requestId: (req as RequestWithId).requestId,
      action: 'auth.pilot_origin_denied',
      ip: clientIp(req),
    });
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const token = await signAppToken(
    { sub: 'pilot-form', role: 'pilot', aud: 'pilot' },
    config.jwtPilotExpiresIn
  );

  res.json({ token, expiresIn: config.jwtPilotExpiresIn, role: 'pilot' });
}
