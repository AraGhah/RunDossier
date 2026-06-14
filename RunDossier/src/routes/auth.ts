import type { Request, Response } from 'express';
import { config } from '../config.js';
import { signAppToken } from '../utils/jwt.js';
import { secureCompare } from '../utils/secure-compare.js';
import { isAllowedBrowserOrigin } from '../utils/origin-check.js';

interface TokenBody {
  apiKey?: unknown;
}

export async function handleAdminToken(req: Request, res: Response): Promise<void> {
  if (!config.jwtSecret || !config.jwtApiKey) {
    res.status(503).json({ error: 'Admin auth not configured' });
    return;
  }

  const body = req.body as TokenBody;
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  if (!apiKey || !secureCompare(apiKey, config.jwtApiKey)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

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
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const token = await signAppToken(
    { sub: 'pilot-form', role: 'pilot', aud: 'pilot' },
    config.jwtPilotExpiresIn
  );

  res.json({ token, expiresIn: config.jwtPilotExpiresIn, role: 'pilot' });
}
