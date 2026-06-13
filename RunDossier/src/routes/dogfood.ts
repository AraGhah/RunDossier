import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { query } from '../db.js';
import { runDogfoodScrape } from '../jobs/dogfood-scrape.job.js';
import { runDogfoodPromote } from '../jobs/dogfood-promote.job.js';
import { logFunnelEvent, type FunnelStage } from '../utils/funnel-log.js';

function requireDogfoodToken(req: Request, res: Response, next: NextFunction): void {
  if (!config.dogfoodApiToken) {
    next();
    return;
  }
  const header = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  if (header === config.dogfoodApiToken || queryToken === config.dogfoodApiToken) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}

export function registerDogfoodRoutes(
  app: import('express').Express
): void {
  app.post('/dogfood/scrape', requireDogfoodToken, async (_req, res) => {
    try {
      const result = await runDogfoodScrape();
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  app.post('/dogfood/promote', requireDogfoodToken, async (_req, res) => {
    try {
      const result = await runDogfoodPromote();
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  app.get('/dogfood/review-queue', requireDogfoodToken, async (_req, res) => {
    try {
      const rows = await query<Record<string, unknown>>(
        `SELECT sq.id AS queue_id, sq.status AS queue_status, sq.created_at,
                sq.subject, sq.opener, sq.bridge, sq.icp_fit_score, sq.confidence_score,
                sq.composite_score,
                p.id AS prospect_id, p.name, p.title, p.linkedin_url, p.smartlead_status
         FROM smartlead_queue sq
         JOIN prospects p ON p.id = sq.prospect_id
         WHERE sq.status IN ('queued', 'failed')
         ORDER BY sq.composite_score DESC NULLS LAST, sq.created_at DESC
         LIMIT 200`
      );
      res.json({ count: rows.length, prospects: rows });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/dogfood/funnel', requireDogfoodToken, async (_req, res) => {
    try {
      const summary = await query<{ stage: string; count: string }>(
        `SELECT stage, COUNT(*)::text AS count
         FROM dogfood_funnel_events
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY stage
         ORDER BY stage`
      );
      res.json({ funnel: summary });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/dogfood/funnel/:prospectId', requireDogfoodToken, async (req, res) => {
    const stage = req.body?.stage as FunnelStage | undefined;
    const allowed: FunnelStage[] = ['open', 'reply', 'demo', 'closed'];
    if (!stage || !allowed.includes(stage)) {
      res.status(400).json({ error: 'stage must be one of: open, reply, demo, closed' });
      return;
    }
    const prospectId = Array.isArray(req.params.prospectId)
      ? req.params.prospectId[0]
      : req.params.prospectId;
    if (!prospectId) {
      res.status(400).json({ error: 'prospectId required' });
      return;
    }
    try {
      await logFunnelEvent(prospectId, stage, req.body?.metadata ?? {});
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
