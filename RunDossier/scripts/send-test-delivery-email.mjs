#!/usr/bin/env node
// Send a TEST W5 delivery email through Resend — CSV attachment + message.
// Mirrors src/utils/resend.ts + delivery-email.ts so it exercises the real shape.
//
// Usage (from the RunDossier folder):
//   node scripts/send-test-delivery-email.mjs you@example.com
// If no recipient is given, it sends to DELIVERY_FROM_EMAIL.
// Reads RESEND_API_KEY + DELIVERY_FROM_EMAIL from RunDossier/.env (values trimmed).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '.env');

function readEnv(key) {
  const txt = readFileSync(envPath, 'utf8');
  const m = txt.match(new RegExp('^' + key + '\\s*=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}

// Usage: node scripts/send-test-delivery-email.mjs <to> [<from>]
// <from> overrides DELIVERY_FROM_EMAIL for the test (e.g. onboarding@resend.dev).
const apiKey = readEnv('RESEND_API_KEY');
const envFrom = readEnv('DELIVERY_FROM_EMAIL');
const to = (process.argv[2] || envFrom).trim();
const from = (process.argv[3] || envFrom).trim();

if (!apiKey || !from) {
  console.error(`Missing RESEND_API_KEY or DELIVERY_FROM_EMAIL in ${envPath}`);
  process.exit(1);
}
console.log(`From: ${from}`);
console.log(`To:   ${to}\n`);

// 1) Domain verification status — explains a rejected send.
try {
  const d = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const dbody = await d.json().catch(() => ({}));
  if (d.status === 401 && dbody?.name === 'restricted_api_key') {
    console.log('Domains: skipped — send-only API key (expected, not a problem)\n');
  } else {
    console.log(`GET /domains -> HTTP ${d.status}`);
    console.log('Domains:', JSON.stringify(dbody), '\n');
  }
} catch (e) {
  console.error('Could not reach Resend (network/DNS):', e.message);
  process.exit(1);
}

// 2) Sample delivery CSV (same columns as buildDeliveryCsv).
const rows = [
  { name: 'Jane Doe', title: 'VP Sales', company: 'Acme', email: 'jane@acme.com',
    subject: 'Loved the Q2 launch', opener: 'Saw Acme shipped self-serve onboarding last week',
    bridge: 'We help RevOps teams cut ramp time', fit_score: 88 },
  { name: 'John Lee', title: 'Head of Growth', company: 'Beta', email: 'john@beta.io',
    subject: 'Your churn comment on the podcast', opener: 'Your point on month-2 churn stuck with me',
    bridge: 'That is exactly what our playbook targets', fit_score: 92 },
];
const esc = (v) => (/[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const header = 'name,title,company,email,subject,opener,bridge,fit_score';
const csv = [header, ...rows.map((r) =>
  [r.name, r.title, r.company, r.email, r.subject, r.opener, r.bridge, r.fit_score].map(esc).join(','),
)].join('\n');

const filename = `Dossier Delivery - TEST - ${new Date().toISOString().slice(0, 10)}.csv`;
const avg = Math.round(rows.reduce((a, r) => a + r.fit_score, 0) / rows.length);
const subject = `Dossier delivery : ${rows.length} personalized openers ready (TEST)`;
const html = `<p>Hi there,</p>
<p>This is a <strong>test</strong> of the Dossier delivery email.</p>
<p><strong>Prospects delivered:</strong> ${rows.length}<br>
<strong>Average fit score:</strong> ${avg}/100</p>
<p><strong>File:</strong> ${filename} (attached to this email)</p>
<p>Talk soon,<br>Ara</p>`;
const text = `Hi there,

This is a test of the Dossier delivery email.
Prospects delivered: ${rows.length}
Average fit score: ${avg}/100
File: ${filename} (attached)

Talk soon,
Ara`;

// 3) Send.
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    html,
    text,
    attachments: [{ filename, content: Buffer.from(csv, 'utf8').toString('base64') }],
  }),
});

const body = await res.text();
if (res.ok) {
  console.log(`✅ Sent — check ${to}. Resend response: ${body}`);
} else {
  console.error(`❌ Resend error HTTP ${res.status}: ${body}`);
  if (res.status === 403 || /not verified|domain/i.test(body)) {
    console.error(
      '\nLikely cause: the sending domain is not verified in Resend.\n' +
      'Fix options:\n' +
      '  • Verify getdossier.co in Resend → Domains (add the DNS records), or\n' +
      '  • Temporarily set DELIVERY_FROM_EMAIL=onboarding@resend.dev and send to your\n' +
      '    Resend account email for the test.',
    );
  }
  process.exit(1);
}
