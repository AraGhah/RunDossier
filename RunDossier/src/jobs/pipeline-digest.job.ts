import { query } from '../db.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import type { DeliveryRunSummary } from './delivery.job.js';

const STATUS_LABELS: Record<string, string> = {
  queued: 'En file',
  research_in_progress: 'Recherche en cours',
  research_complete: 'Recherche terminée',
  thin_research: 'Recherche faible',
  research_failed: 'Échec recherche',
  personalization_in_progress: 'Personnalisation en cours',
  personalized_qa_passed: 'QA OK — prêt à livrer',
  qa_failed: 'Échec QA',
  personalization_failed: 'Échec personnalisation',
  delivered: 'Livrés',
};

function fmt(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? String(v) : '0';
}

async function countByStatus(): Promise<Map<string, number>> {
  const rows = await query<{ status: string; count: string }>(
    `SELECT trim(status) AS status, COUNT(*)::text AS count
     FROM prospects
     WHERE client_id IS NOT NULL
     GROUP BY trim(status)`,
  );
  return new Map(rows.map((r) => [r.status, Number(r.count)]));
}

async function clientBreakdown(): Promise<string[]> {
  const rows = await query<{
    client_name: string;
    status: string;
    count: string;
  }>(
    `SELECT c.name AS client_name, trim(p.status) AS status, COUNT(*)::text AS count
     FROM prospects p
     JOIN clients c ON c.id = p.client_id
     GROUP BY c.name, trim(p.status)
     ORDER BY c.name, trim(p.status)`,
  );

  const byClient = new Map<string, string[]>();
  for (const row of rows) {
    const label = STATUS_LABELS[row.status] ?? row.status;
    const lines = byClient.get(row.client_name) ?? [];
    lines.push(`    ${label}: ${row.count}`);
    byClient.set(row.client_name, lines);
  }

  return [...byClient.entries()].map(([name, lines]) => `  ${name}\n${lines.join('\n')}`);
}

export function shouldSendDigest(opts: {
  deliverySummary?: DeliveryRunSummary;
  newProspects: number;
  searchLeads: number;
  searchIngested: number;
  researchedLastHour: number;
  qaPassedLastHour: number;
  deliveredLastHour: number;
  recentFailureCount: number;
  readyToDeliver: number;
  pipelineActive: number;
}): boolean {
  if (!config.telegramDigestQuiet) return true;
  if (opts.deliverySummary && (opts.deliverySummary.prospectsDelivered > 0 || opts.deliverySummary.errors.length > 0)) {
    return true;
  }
  if (opts.recentFailureCount > 0) return true;
  if (opts.readyToDeliver > 0 || opts.pipelineActive > 0) return true;
  return (
    opts.newProspects > 0 ||
    opts.searchLeads > 0 ||
    opts.searchIngested > 0 ||
    opts.researchedLastHour > 0 ||
    opts.qaPassedLastHour > 0 ||
    opts.deliveredLastHour > 0
  );
}

export async function runPipelineDigest(deliverySummary?: DeliveryRunSummary): Promise<void> {
  const [
    newProspects,
    researchedLastHour,
    qaPassedLastHour,
    deliveredLastHour,
    searchStats,
    recentFailures,
    readyToDeliver,
    pipelineActive,
  ] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE client_id IS NOT NULL AND created_at >= NOW() - INTERVAL '1 hour'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE client_id IS NOT NULL
         AND trim(status) IN ('research_complete', 'thin_research')
         AND updated_at >= NOW() - INTERVAL '1 hour'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE client_id IS NOT NULL
         AND trim(status) IN ('personalized_qa_passed', 'delivered')
         AND updated_at >= NOW() - INTERVAL '1 hour'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE delivered_at >= NOW() - INTERVAL '1 hour'`,
    ),
    query<{ leads: string | null; ingested: string | null }>(
      `SELECT COALESCE(SUM(leads_found), 0)::text AS leads,
              COALESCE(SUM(leads_ingested), 0)::text AS ingested
       FROM search_runs
       WHERE started_at >= NOW() - INTERVAL '1 hour'`,
    ).catch(() => [{ leads: '0', ingested: '0' }]),
    query<{ workflow: string; error: string; created_at: Date }>(
      `SELECT workflow, error, created_at
       FROM failed_jobs
       WHERE created_at >= NOW() - INTERVAL '1 hour'
         AND error NOT LIKE 'duplicate linkedin_url%'
         AND error NOT LIKE 'duplicate email%'
         AND error NOT LIKE 'duplicate name+company%'
         AND error NOT LIKE 'recently delivered prospect%'
       ORDER BY created_at DESC
       LIMIT 5`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE trim(status) = 'personalized_qa_passed'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM prospects
       WHERE trim(status) IN (
         'queued', 'research_in_progress', 'research_complete',
         'personalization_in_progress', 'research_failed', 'qa_failed'
       )`,
    ),
  ]);

  const statusMap = await countByStatus();
  const pipelineLines = [...statusMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => {
      const label = STATUS_LABELS[status] ?? status;
      return `  • ${label}: ${count}`;
    });

  const clientLines = await clientBreakdown();
  const searchRow = searchStats[0] ?? { leads: '0', ingested: '0' };

  const digestMetrics = {
    deliverySummary,
    newProspects: Number(newProspects[0]?.count ?? 0),
    searchLeads: Number(searchRow.leads ?? 0),
    searchIngested: Number(searchRow.ingested ?? 0),
    researchedLastHour: Number(researchedLastHour[0]?.count ?? 0),
    qaPassedLastHour: Number(qaPassedLastHour[0]?.count ?? 0),
    deliveredLastHour: Number(deliveredLastHour[0]?.count ?? 0),
    recentFailureCount: recentFailures.length,
    readyToDeliver: Number(readyToDeliver[0]?.count ?? 0),
    pipelineActive: Number(pipelineActive[0]?.count ?? 0),
  };

  if (!shouldSendDigest(digestMetrics)) {
    return;
  }

  const lines: string[] = [
    '📊 Dossier — rapport horaire',
    '',
    'Pipeline (tous clients)',
    ...pipelineLines,
    `  • Actifs (en cours): ${fmt(pipelineActive[0]?.count)}`,
    `  • Prêts à livrer: ${fmt(readyToDeliver[0]?.count)}`,
    '',
    'Dernière heure',
    `  • Nouveaux prospects (intake): ${fmt(newProspects[0]?.count)}`,
    `  • Prospects trouvés (W1 search): ${fmt(searchRow.leads)} → ${fmt(searchRow.ingested)} ingérés`,
    `  • Recherches terminées: ${fmt(researchedLastHour[0]?.count)}`,
    `  • QA passée / livrables: ${fmt(qaPassedLastHour[0]?.count)}`,
    `  • Livrés: ${fmt(deliveredLastHour[0]?.count)}`,
  ];

  if (deliverySummary) {
    lines.push(
      '',
      'Livraison (ce cycle)',
      `  • Clients traités: ${deliverySummary.clientsProcessed}`,
      `  • Prospects livrés: ${deliverySummary.prospectsDelivered}`,
    );
    if (deliverySummary.details.length > 0) {
      for (const d of deliverySummary.details) {
        lines.push(`  • ${d}`);
      }
    }
    if (deliverySummary.errors.length > 0) {
      lines.push('  • Erreurs livraison:');
      for (const e of deliverySummary.errors) {
        lines.push(`    - ${e}`);
      }
    }
  }

  if (clientLines.length > 0) {
    lines.push('', 'Par client', ...clientLines);
  }

  if (recentFailures.length > 0) {
    lines.push('', 'Échecs récents (1 h, max 5)');
    for (const f of recentFailures) {
      const time = f.created_at instanceof Date ? f.created_at.toISOString().slice(11, 16) : '';
      const err = f.error.length > 120 ? `${f.error.slice(0, 117)}...` : f.error;
      lines.push(`  • [${f.workflow}] ${time} — ${err}`);
    }
  }

  await notify(lines.join('\n'));
}
