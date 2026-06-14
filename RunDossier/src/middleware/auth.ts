import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { verifyAppToken, type AppJwtClaims, type AppRole } from '../utils/jwt.js';
import { secureCompare } from '../utils/secure-compare.js';

export interface AuthenticatedRequest extends Request {
  auth?: AppJwtClaims;
}

function bearerToken(req: Request): string {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '').trim() ?? '';
}

export function requireJwt(options?: { role?: AppRole; audience?: string }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.jwtSecret) {
      res.status(503).json({ error: 'JWT not configured' });
      return;
    }

    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      (req as AuthenticatedRequest).auth = await verifyAppToken(token, options);
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

/** Admin routes: JWT (role admin) or legacy DOGFOOD_API_TOKEN header only. */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = bearerToken(req);

  if (config.jwtSecret && token) {
    try {
      (req as AuthenticatedRequest).auth = await verifyAppToken(token, { role: 'admin' });
      next();
      return;
    } catch {
      // fall through to legacy token
    }
  }

  if (config.dogfoodApiToken && token && secureCompare(token, config.dogfoodApiToken)) {
    next();
    return;
  }

  if (config.jwtSecret || config.dogfoodApiToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
