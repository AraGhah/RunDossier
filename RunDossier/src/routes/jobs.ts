import { requireAdmin } from '../middleware/auth.js';
import { listFailedJobs, retryFailedJob } from '../services/jobs.service.js';

function parseUuid(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) return null;
  return value;
}

export function registerJobRoutes(app: import('express').Express): void {
  app.get('/api/jobs/failed', requireAdmin, async (req, res) => {
    try {
      const workflow = typeof req.query.workflow === 'string' ? req.query.workflow : undefined;
      const limit = parseInt(String(req.query.limit ?? '50'), 10);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);
      const result = await listFailedJobs({ workflow, limit, offset });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/jobs/retry', requireAdmin, async (req, res) => {
    const failedJobId = parseUuid(req.body?.failedJobId ?? req.body?.failed_job_id);
    if (!failedJobId) {
      res.status(400).json({ error: 'failedJobId (UUID) is required' });
      return;
    }

    try {
      const result = await retryFailedJob(failedJobId);
      res.json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Failed job not found') {
        res.status(404).json({ error: message });
        return;
      }
      if (message.includes('cannot be retried')) {
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  });
}
