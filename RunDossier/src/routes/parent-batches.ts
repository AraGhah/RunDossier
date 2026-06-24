import type { Express } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { sendInternalError } from '../utils/safe-error.js';
import { startParentBatch } from '../services/start-parent-batch.js';
import { ActiveParentBatchError } from '../services/parent-batch.js';
import {
  getParentBatchDashboard,
  resumeParentBatch,
  listActiveParentBatches,
} from '../services/parent-batch.js';
import { kickBatchOrchestrator } from '../utils/kick-orchestrator.js';
import { normalizeIntakeRecord, type IntakeRecord } from '../services/intake.js';

function parseUuidParam(value: string | string[] | undefined): string | null {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

export function registerParentBatchRoutes(app: Express): void {
  app.post('/api/parent-batches', requireAdmin, async (req, res) => {
    const clientId = typeof req.body?.client_id === 'string' ? req.body.client_id.trim() : '';
    const requestedCount = parseInt(String(req.body?.requested_count ?? req.body?.requested_prospect_count ?? '0'), 10);

    if (!clientId) {
      res.status(400).json({ error: 'client_id is required' });
      return;
    }
    if (!Number.isFinite(requestedCount) || requestedCount < 1) {
      res.status(400).json({ error: 'requested_count must be a positive integer' });
      return;
    }

    let prospects: IntakeRecord[] | undefined;
    try {
      const raw = req.body?.prospects;
      if (Array.isArray(raw)) {
        prospects = raw.map((row) => normalizeIntakeRecord(row as Record<string, unknown>));
      }
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }

    try {
      const result = await startParentBatch({
        clientId,
        requestedCount,
        prospects,
        metadata: typeof req.body?.metadata === 'object' ? req.body.metadata : undefined,
      });
      res.status(201).json({
        ok: true,
        parent_batch_id: result.parentBatch.id,
        requested_count: result.parentBatch.requested_prospect_count,
        inserted: result.intake.inserted,
        skipped: result.intake.skipped,
        invalid: result.intake.invalid,
      });
    } catch (err) {
      if (err instanceof ActiveParentBatchError) {
        res.status(409).json({
          error: err.message,
          existing_parent_batch_id: err.existingBatchId,
        });
        return;
      }
      sendInternalError(res, req, err, 'parent_batch_create_failed');
    }
  });

  app.get('/api/parent-batches/active', requireAdmin, async (req, res) => {
    try {
      const batches = await listActiveParentBatches();
      const dashboards = await Promise.all(
        batches.map((b) => getParentBatchDashboard(b.id))
      );
      res.json({ count: dashboards.filter(Boolean).length, batches: dashboards.filter(Boolean) });
    } catch (err) {
      sendInternalError(res, req, err, 'parent_batch_list_failed');
    }
  });

  app.get('/api/parent-batches/:id', requireAdmin, async (req, res) => {
    const id = parseUuidParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid parent batch id' });
      return;
    }
    try {
      const dashboard = await getParentBatchDashboard(id);
      if (!dashboard) {
        res.status(404).json({ error: 'Parent batch not found' });
        return;
      }
      res.json({ parent_batch: dashboard });
    } catch (err) {
      sendInternalError(res, req, err, 'parent_batch_get_failed');
    }
  });

  app.post('/api/parent-batches/:id/resume', requireAdmin, async (req, res) => {
    const id = parseUuidParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid parent batch id' });
      return;
    }
    try {
      const batch = await resumeParentBatch(id);
      if (!batch) {
        res.status(404).json({ error: 'Parent batch not found or not resumable' });
        return;
      }
      void kickBatchOrchestrator(batch.id);
      res.json({ ok: true, parent_batch_id: batch.id, status: batch.status });
    } catch (err) {
      sendInternalError(res, req, err, 'parent_batch_resume_failed');
    }
  });
}
