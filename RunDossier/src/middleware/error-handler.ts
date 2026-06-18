import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import type { RequestWithId } from './request-id.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as RequestWithId).requestId;
  logger.error('unhandled_route_error', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
  });

  if (res.headersSent) return;

  res.status(500).json({
    error: 'Internal server error',
    requestId,
  });
}
