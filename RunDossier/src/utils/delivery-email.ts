import type { DeliveryRow } from './csv-delivery.js';

export interface DeliveryEmailStats {
  delivered: number;
  requested?: number;
  ingested?: number;
  skipped?: number;
  thinResearchExcluded?: number;
  qaFailed?: number;
  researchFailed?: number;
  permanentlyFailed?: number;
  replacementUsed?: boolean;
  fullyComplete?: boolean;
  partialReason?: string;
  runId?: string;
  deliveryId?: string;
  parentBatchId?: string;
  driveUrl?: string;
}

export interface DeliveryEmailContent {
  subject: string;
  html: string;
  text: string;
}

function averageFitScore(rows: Pick<DeliveryRow, 'confidence_score'>[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + Number(row.confidence_score || 0), 0);
  return Math.round(sum / rows.length);
}

function buildSummaryBlock(stats: DeliveryEmailStats | undefined): string {
  if (!stats) return '';
  const lines = [
    stats.requested != null ? `Originally requested: ${stats.requested}` : '',
    `Qualified prospects delivered: ${stats.delivered}`,
    stats.thinResearchExcluded != null && stats.thinResearchExcluded > 0
      ? `Excluded weak research (thin_research): ${stats.thinResearchExcluded}`
      : '',
    stats.permanentlyFailed != null && stats.permanentlyFailed > 0
      ? `Permanently failed: ${stats.permanentlyFailed}`
      : '',
    stats.qaFailed != null && stats.qaFailed > 0 ? `QA failed (not delivered): ${stats.qaFailed}` : '',
    stats.researchFailed != null && stats.researchFailed > 0
      ? `Research failed: ${stats.researchFailed}`
      : '',
    stats.replacementUsed ? 'Replacement prospects were used to reach the target.' : '',
    stats.fullyComplete === false
      ? `Batch status: PARTIALLY COMPLETE${stats.partialReason ? ` — ${stats.partialReason}` : ''}`
      : stats.fullyComplete === true
        ? 'Batch status: FULLY COMPLETE'
        : '',
    stats.ingested != null ? `Prospects ingested this cycle: ${stats.ingested}` : '',
    stats.skipped != null ? `Prospects skipped (duplicate/invalid): ${stats.skipped}` : '',
    stats.deliveryId ? `Delivery ID: ${stats.deliveryId}` : '',
    stats.parentBatchId ? `Parent batch ID: ${stats.parentBatchId}` : '',
    stats.runId ? `Run ID: ${stats.runId}` : '',
    stats.driveUrl ? `Google Drive: ${stats.driveUrl}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

/** W5 delivery email with CSV attachment summary */
export function buildDeliveryEmailContent(
  clientFirstName: string | null,
  rowCount: number,
  rows: DeliveryRow[],
  filename: string,
  stats?: DeliveryEmailStats
): DeliveryEmailContent {
  const greeting = clientFirstName?.trim() || 'there';
  const avgFit = averageFitScore(rows);
  const completeLabel =
    stats?.fullyComplete === false ? ' (partial batch)' : stats?.fullyComplete === true ? '' : '';
  const subject = `Dossier delivery${completeLabel}: ${rowCount} personalized openers ready`;
  const summaryText = buildSummaryBlock(stats);
  const summaryHtml = summaryText
    .split('\n')
    .map((line) => `<br>${escapeHtml(line)}`)
    .join('');

  const weakNote =
    stats?.thinResearchExcluded && stats.thinResearchExcluded > 0
      ? `<p><strong>Note:</strong> ${stats.thinResearchExcluded} prospect(s) were excluded from this delivery because research did not meet the quality gate (thin_research).</p>`
      : '';

  const partialNote =
    stats?.fullyComplete === false && stats.partialReason
      ? `<p><strong>Partial delivery:</strong> ${escapeHtml(stats.partialReason)}</p>`
      : '';

  const html = `<p>Hi ${escapeHtml(greeting)},</p>

<p>Your Dossier batch is ready${completeLabel}: ${rowCount} prospect${rowCount === 1 ? '' : 's'}, each with a subject line, opener, and bridge built from a specific, recent signal.</p>

<p><strong>Average confidence score:</strong> ${avgFit}/100</p>
${summaryHtml ? `<p><strong>Delivery summary:</strong>${summaryHtml}</p>` : ''}
${weakNote}
${partialNote}
<p><strong>File:</strong> ${escapeHtml(filename)} (attached to this email)</p>

<p>Each row includes prospect details, verified research signals, source links, and personalized copy fields ready for your sequencer.</p>

<p>Talk soon,<br>Ara</p>`;

  const text = `Hi ${greeting},

Your Dossier batch is ready${completeLabel}: ${rowCount} prospect${rowCount === 1 ? '' : 's'}.

Average confidence score: ${avgFit}/100
${summaryText ? `\nDelivery summary:\n${summaryText}\n` : ''}${
    stats?.thinResearchExcluded && stats.thinResearchExcluded > 0
      ? `\nNote: ${stats.thinResearchExcluded} prospect(s) excluded due to weak research (thin_research).\n`
      : ''
  }${
    stats?.fullyComplete === false && stats.partialReason
      ? `\nPartial delivery: ${stats.partialReason}\n`
      : ''
  }
File: ${filename} (attached)

Talk soon,
Ara`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
