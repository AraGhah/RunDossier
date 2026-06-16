import type { Request, Response } from 'express';
import { query } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  createSearchProfile,
  listSearchProfiles,
  runProspectSearch,
  runAllEnabledSearches,
  type CreateSearchProfileInput,
} from '../services/prospect-search.js';

const SALES_NAV_URL_RE = /^https:\/\/(www\.)?linkedin\.com\/sales\/search\//i;

function parseProfileBody(body: unknown): CreateSearchProfileInput | string {
  if (!body || typeof body !== 'object') return 'Invalid JSON body';
  const b = body as Record<string, unknown>;

  const client_id = typeof b.client_id === 'string' ? b.client_id.trim() : '';
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const search_url = typeof b.search_url === 'string' ? b.search_url.trim() : '';

  if (!client_id) return 'client_id is required';
  if (!name) return 'name is required';
  if (!search_url || !SALES_NAV_URL_RE.test(search_url)) {
    return 'search_url must be a LinkedIn Sales Navigator search URL';
  }

  const title_keywords = Array.isArray(b.title_keywords)
    ? b.title_keywords.map((k) => String(k).trim()).filter(Boolean)
    : undefined;

  const min_employees = typeof b.min_employees === 'number' ? b.min_employees : undefined;
  const max_employees = typeof b.max_employees === 'number' ? b.max_employees : undefined;
  const min_icp_score = typeof b.min_icp_score === 'number' ? b.min_icp_score : undefined;
  const max_results_per_run =
    typeof b.max_results_per_run === 'number' ? b.max_results_per_run : undefined;

  return {
    client_id,
    name,
    search_url,
    title_keywords,
    min_employees,
    max_employees,
    min_icp_score,
    max_results_per_run,
    enrich_profiles: typeof b.enrich_profiles === 'boolean' ? b.enrich_profiles : undefined,
    enabled: typeof b.enabled === 'boolean' ? b.enabled : undefined,
  };
}

export function registerSearchRoutes(app: import('express').Express): void {
  app.get('/api/search/profiles', requireAdmin, async (req, res) => {
    try {
      const clientId = typeof req.query.client_id === 'string' ? req.query.client_id : undefined;
      const profiles = await listSearchProfiles(clientId);
      res.json({ count: profiles.length, profiles });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/search/profiles', requireAdmin, async (req, res) => {
    const parsed = parseProfileBody(req.body);
    if (typeof parsed === 'string') {
      res.status(400).json({ error: parsed });
      return;
    }
    try {
      const profile = await createSearchProfile(parsed);
      res.status(201).json({ ok: true, profile });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/search/run', requireAdmin, async (req, res) => {
    const profileId = typeof req.body?.profile_id === 'string' ? req.body.profile_id.trim() : '';
    const clientId = typeof req.body?.client_id === 'string' ? req.body.client_id.trim() : '';
    const runAll = req.body?.all === true;

    try {
      if (runAll) {
        const results = await runAllEnabledSearches();
        res.json({ ok: true, results });
        return;
      }

      if (profileId) {
        const result = await runProspectSearch(profileId);
        res.json({ ok: true, result });
        return;
      }

      if (clientId) {
        const profiles = await listSearchProfiles(clientId);
        const enabled = profiles.filter((p) => p.enabled);
        const results = [];
        for (const p of enabled) {
          results.push(await runProspectSearch(p.id));
        }
        res.json({ ok: true, results });
        return;
      }

      res.status(400).json({ error: 'Provide profile_id, client_id, or all: true' });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/search/runs', requireAdmin, async (req, res) => {
    try {
      const clientId = typeof req.query.client_id === 'string' ? req.query.client_id : undefined;
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));

      const runs = clientId
        ? await query(
            `SELECT sr.*, csp.name AS profile_name
             FROM search_runs sr
             JOIN client_search_profiles csp ON csp.id = sr.profile_id
             WHERE sr.client_id = $1
             ORDER BY sr.started_at DESC
             LIMIT $2`,
            [clientId, limit]
          )
        : await query(
            `SELECT sr.*, csp.name AS profile_name
             FROM search_runs sr
             JOIN client_search_profiles csp ON csp.id = sr.profile_id
             ORDER BY sr.started_at DESC
             LIMIT $1`,
            [limit]
          );

      res.json({ count: runs.length, runs });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
