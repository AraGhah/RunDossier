import type { Express, Request, Response } from 'express';
import {
  createCampaign,
  getCampaign,
  listCampaigns,
  updateDraft,
  queueCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getCampaignEvents,
  refreshCampaignCounters,
} from '../services/campaign.service.js';
import { requireAdmin } from '../middleware/auth.js';

function ok(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ ok: true, data });
}

function fail(res: Response, err: unknown, status = 400): void {
  const message = err instanceof Error ? err.message : String(err);
  res.status(status).json({ ok: false, error: message });
}

function id(req: Request): string {
  const v = id(req);
  return Array.isArray(v) ? v[0] : v;
}

export function registerCampaignRoutes(app: Express): void {
  // List all campaigns (optionally filter by client)
  app.get('/api/campaigns', requireAdmin, (req: Request, res: Response) => {
    const clientId = typeof req.query.client_id === 'string' ? req.query.client_id : undefined;
    void listCampaigns(clientId)
      .then(rows => ok(res, rows))
      .catch(err => fail(res, err));
  });

  // Get a single campaign
  app.get('/api/campaigns/:id', requireAdmin, (req: Request, res: Response) => {
    void getCampaign(id(req))
      .then(row => row ? ok(res, row) : res.status(404).json({ ok: false, error: 'Not found' }))
      .catch(err => fail(res, err));
  });

  // Get campaign activity log
  app.get('/api/campaigns/:id/events', requireAdmin, (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    void getCampaignEvents(id(req), limit)
      .then(rows => ok(res, rows))
      .catch(err => fail(res, err));
  });

  // Refresh campaign counters
  app.post('/api/campaigns/:id/refresh', requireAdmin, (req: Request, res: Response) => {
    void refreshCampaignCounters(id(req))
      .then(() => getCampaign(id(req)))
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });

  // Create a new campaign (draft)
  app.post('/api/campaigns', requireAdmin, (req: Request, res: Response) => {
    void createCampaign(req.body)
      .then(row => ok(res, row, 201))
      .catch(err => fail(res, err));
  });

  // Update a draft campaign
  app.patch('/api/campaigns/:id', requireAdmin, (req: Request, res: Response) => {
    void updateDraft(id(req), req.body)
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });

  // Start (queue) a campaign
  app.post('/api/campaigns/:id/start', requireAdmin, (req: Request, res: Response) => {
    void queueCampaign(id(req), 'operator')
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });

  // Pause a campaign
  app.post('/api/campaigns/:id/pause', requireAdmin, (req: Request, res: Response) => {
    void pauseCampaign(id(req), 'operator')
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });

  // Resume a paused campaign
  app.post('/api/campaigns/:id/resume', requireAdmin, (req: Request, res: Response) => {
    void resumeCampaign(id(req), 'operator')
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });

  // Cancel a campaign
  app.post('/api/campaigns/:id/cancel', requireAdmin, (req: Request, res: Response) => {
    const { reason } = req.body ?? {};
    void cancelCampaign(id(req), { actor: 'operator', reason: typeof reason === 'string' ? reason : undefined })
      .then(row => ok(res, row))
      .catch(err => fail(res, err));
  });
}
