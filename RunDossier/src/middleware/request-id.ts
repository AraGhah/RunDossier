import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof incoming === 'string' && incoming.trim()
      ? incoming.trim().slice(0, 64)
      : randomUUID();
  (req as RequestWithId).requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
