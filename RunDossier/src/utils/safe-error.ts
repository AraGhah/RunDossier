import type { Request, Response } from 'express';
import { logger } from './logger.js';
import type { RequestWithId } from '../middleware/request-id.js';

/** ITSAP.60.005 — hide SQL/stack details from clients; log server-side only. */
export function sendInternalError(
  res: Response,
  req: Request,
  err: unknown,
  logTag: string
): void {
  const requestId = (req as RequestWithId).requestId;
  logger.error(logTag, {
    requestId,
    error: err instanceof Error ? err.message : String(err),
  });
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', requestId });
}

export function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}
