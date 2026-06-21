/**
 * Client communication email templates (Step 35).
 * Reusable, parameterized copy used by the onboarding, delivery, and billing flows.
 * Rules: under 150 words, professional but human, one clear ask, no "hope this finds
 * you well", and never over-apologize -- state the issue, the fix, and the ETA.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const SIGNOFF = 'Ara, Dossier';

function build(subject: string, paras: string[]): EmailTemplate {
  const body = [...paras, SIGNOFF];
  return {
    subject,
    text: body.join('\n\n'),
    html: body.map((p) => `<p>${p}</p>`).join('\n'),
  };
}

function hi(firstName?: string | null): string {
  return firstName?.trim() || 'there';
}

/** 1. Onboarding welcome. */
export function onboardingWelcome(v: { firstName?: string; formUrl: string }): EmailTemplate {
  return build("You're in - let's build your list", [
    `Hi ${hi(v.firstName)}, welcome to Dossier.`,
    "Here's how it works: you tell us exactly who you want to reach, we research each prospect and write a first line grounded in something real they did, and you get them back ready to send.",
    `Two-minute first step - tell us your ideal customer: ${v.formUrl}`,
    'The sharper you are, the better your first batch. Once you submit, we read it back to you for sign-off before sourcing anyone.',
  ]);
}

/** 2. ICP confirmation + approval ask. */
export function icpConfirmation(v: {
  firstName?: string;
  icpSummary: string;
  approveUrl: string;
}): EmailTemplate {
  return build('Confirm your ICP before we start', [
    `Hi ${hi(v.firstName)}, here's how we read your ideal customer:`,
    `"${v.icpSummary}"`,
    `If that's right, approve and we'll start sourcing: ${v.approveUrl}`,
    "If anything's off - wrong titles, region, or angle - just reply and tell me what to change. Nothing gets sourced until you say go.",
  ]);
}

/** 3. Delivery notification + stats. */
export function deliveryNotification(v: {
  firstName?: string;
  count: number;
  avgFitScore?: number;
  nextDeliveryDate?: string;
}): EmailTemplate {
  const fit = v.avgFitScore != null ? `, at an average research-fit score of ${v.avgFitScore}/100` : '';
  const next = v.nextDeliveryDate ? `. Next batch lands ${v.nextDeliveryDate}` : '';
  return build(`Your ${v.count} openers are ready`, [
    `Hi ${hi(v.firstName)}, this week's batch is in - ${v.count} prospects, each with a first line tied to something specific they posted, shipped, or hired for${fit}.`,
    "The CSV is attached: name, company, LinkedIn, subject, opener, and the signal it's built on. Drop these straight into your sequencer.",
    `If any line misses, flag it and I'll recut it${next}.`,
  ]);
}

/** 4. Day-14 reply-rate check-in. */
export function day14CheckIn(v: { firstName?: string; replyRate?: number }): EmailTemplate {
  const rate = v.replyRate != null ? ` Your reply rate so far is ${v.replyRate}%.` : '';
  return build('Two weeks in - how are the replies?', [
    `Hi ${hi(v.firstName)}, your first batches have been out about two weeks.${rate}`,
    "The number I care about isn't volume - it's whether the right people are replying.",
    "Send me 2-3 replies you got, good or bad, and I'll tune the next batch's targeting and first lines to pull more of the good ones.",
  ]);
}

/** 5. Billing receipt. */
export function billingReceipt(v: {
  firstName?: string;
  amount: string;
  period: string;
  plan?: string;
  invoiceNumber?: string;
}): EmailTemplate {
  const plan = v.plan ? ` - Plan: ${v.plan}` : '';
  const inv = v.invoiceNumber ? ` - Invoice: ${v.invoiceNumber}` : '';
  return build(`Receipt - Dossier ${v.period}`, [
    `Hi ${hi(v.firstName)}, your payment went through - thank you.`,
    `Amount: ${v.amount}${plan} - Period: ${v.period}${inv}.`,
    "Nothing's needed from you; your batches continue on schedule.",
    'Reply here if you need a formal invoice for accounting or want to change plans.',
  ]);
}

/** 6. Failed payment follow-up. */
export function failedPayment(v: {
  firstName?: string;
  amount: string;
  updateUrl: string;
  retryDate: string;
}): EmailTemplate {
  return build("Your payment didn't go through", [
    `Hi ${hi(v.firstName)}, your last payment (${v.amount}) didn't clear - usually an expired card or a bank hold.`,
    `Fix it here and you're set: ${v.updateUrl}`,
    `We'll retry automatically on ${v.retryDate}, and your batches keep running until then - no interruption yet.`,
    "If it's still unpaid after that retry, we'll pause new sourcing until it's sorted.",
  ]);
}

export const clientEmails = {
  onboardingWelcome,
  icpConfirmation,
  deliveryNotification,
  day14CheckIn,
  billingReceipt,
  failedPayment,
};
