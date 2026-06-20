import type { Request, Response } from 'express';
import { ingestProspects, normalizeIntakeRecord, type IntakeRecord } from '../services/intake.js';
import { sendInternalError } from '../utils/safe-error.js';
import { writeAuditEvent } from '../utils/audit-log.js';
import type { RequestWithId } from '../middleware/request-id.js';

export async function handleIntakeSubmit(req: Request, res: Response): Promise<void> {
  const body = req.body;

  let records: IntakeRecord[];
  try {
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
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
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
    const result = await ingestProspects(records);
    void writeAuditEvent({
      requestId: (req as RequestWithId).requestId,
      action: 'intake.success',
      actorRole: 'admin',
      metadata: { inserted: result.inserted, skipped: result.skipped },
    });
    res.status(200).json({
      ok: true,
      ...result,
      message: `${result.inserted} prospect(s) queued for research`,
    });
  } catch (err) {
    sendInternalError(res, req, err, 'intake_failed');
  }
}
