import type { DeliveryRow } from './csv-delivery.js';

export interface DeliveryEmailContent {
  subject: string;
  html: string;
  text: string;
}

function averageFitScore(rows: DeliveryRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + Number(row.fit_score || 0), 0);
  return Math.round(sum / rows.length);
}

/** W5 n8n — Gmail node "Email - Notify Client / Notify Yourself" */
export function buildDeliveryEmailContent(
  clientFirstName: string | null,
  rowCount: number,
  rows: DeliveryRow[],
  filename: string
): DeliveryEmailContent {
  const greeting = clientFirstName?.trim() || 'there';
  const avgFit = averageFitScore(rows);
  const subject = `Dossier delivery : ${rowCount} personalized openers ready`;

  const html = `<p>Hi ${escapeHtml(greeting)},</p>

<p>Your latest Dossier batch is ready : ${rowCount} prospect${rowCount === 1 ? '' : 's'}, each with a subject line, opener, and bridge built from a specific, recent signal, not generic fill-in-the-blank personalization.</p>

<p><strong>Prospects delivered:</strong> ${rowCount}<br>
<strong>Average fit score:</strong> ${avgFit}/100</p>

<p><strong>File:</strong> ${escapeHtml(filename)} (attached to this email)</p>

<p>Each row has the prospect details plus the three copy fields, ready to map into your sequencer. Give it a quick scan before you import — if any opener doesn't fit your voice, flag it and I'll fix that one.</p>

<p>Talk soon,<br>Ara</p>`;

  const text = `Hi ${greeting},

Your latest Dossier batch is ready : ${rowCount} prospect${rowCount === 1 ? '' : 's'}, each with a subject line, opener, and bridge built from a specific, recent signal.

Prospects delivered: ${rowCount}
Average fit score: ${avgFit}/100
File: ${filename} (attached)

Each row has the prospect details plus the three copy fields, ready to map into your sequencer.

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
