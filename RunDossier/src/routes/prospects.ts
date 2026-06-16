import type { Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getBatchById,
  getProspectById,
  importProspects,
  listProspects,
  normalizeIntakeRecord,
  retriggerResearch,
  type IntakeRecord,
} from '../services/prospect.service.js';

function parseUuidParam(value: string | string[] | undefined): string | null {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

export function registerProspectRoutes(app: import('express').Express): void {
  app.get('/api/prospects', requireAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const clientId = typeof req.query.client_id === 'string' ? req.query.client_id : undefined;
      const limit = parseInt(String(req.query.limit ?? '50'), 10);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);

      const result = await listProspects({ status, clientId, limit, offset });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/prospects/:id', requireAdmin, async (req, res) => {
    const id = parseUuidParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid prospect id' });
      return;
    }
    try {
      const prospect = await getProspectById(id);
      if (!prospect) {
        res.status(404).json({ error: 'Prospect not found' });
        return;
      }
      res.json({ prospect });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/prospects/:id/research', requireAdmin, async (req, res) => {
    const id = parseUuidParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid prospect id' });
      return;
    }
    try {
      const result = await retriggerResearch(id);
      res.json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Prospect not found') {
        res.status(404).json({ error: message });
        return;
      }
      if (message.startsWith('Cannot re-research')) {
        res.status(409).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/prospects/import', requireAdmin, async (req, res) => {
    const body = req.body;
    let records: IntakeRecord[];

    if (Array.isArray(body)) {
      records = body.map(row => normalizeIntakeRecord(row as Record<string, unknown>));
    } else if (body && typeof body === 'object' && Array.isArray((body as { prospects?: unknown }).prospects)) {
      records = ((body as { prospects: Record<string, unknown>[] }).prospects).map(row =>
        normalizeIntakeRecord(row)
      );
    } else {
      res.status(400).json({ error: 'Body must be a JSON array or { prospects: [...] }' });
      return;
    }

    if (records.length === 0) {
      res.status(400).json({ error: 'No prospects provided' });
      return;
    }
    if (records.length > 500) {
      res.status(400).json({ error: 'Maximum 500 prospects per request' });
      return;
    }

    try {
      const source =
        body && typeof body === 'object' && (body as { source?: string }).source === 'search'
          ? 'search'
          : 'manual';
      const result = await importProspects(records, { source });
      res.status(200).json({
        ok: true,
        ...result,
        message: `${result.inserted} prospect(s) queued for research`,
      });
    } catch (err) {
      res.status(500).json({ error: 'Import failed', detail: (err as Error).message });
    }
  });

  app.get('/api/batches/:id', requireAdmin, async (req, res) => {
    const id = parseUuidParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid batch id' });
      return;
    }
    try {
      const batch = await getBatchById(id);
      if (!batch) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }
      res.json({ batch });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
