import type { Request } from 'express';
import { config } from '../config.js';

export function getClientIp(req: Request): string {
  if (config.trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}
