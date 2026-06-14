import type { Request } from 'express';
import { config } from '../config.js';

/** Browser-only endpoints: require Origin or Referer from an allowed CORS origin. */
export function isAllowedBrowserOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (origin && config.corsOrigins.includes(origin)) return true;

  const referer = req.headers.referer;
  if (referer) {
    try {
      return config.corsOrigins.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}
