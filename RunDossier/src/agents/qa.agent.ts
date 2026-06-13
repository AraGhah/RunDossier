import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { trackCost } from '../utils/cost-tracker.js';

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export interface QaInput {
  leadId: string;
  subject: string;
  emailBody: string;
  linkedinNote: string;
}

export interface QaOutput {
  passed: boolean;
  score: number; // 0–100
  issues: string[];
}

export async function runQaAgent(input: QaInput): Promise<QaOutput> {
  const prompt = `You are a QA reviewer for B2B cold outreach. Score the following copy on a 0-100 scale.

Subject: ${input.subject}
Email body: ${input.emailBody}
LinkedIn note: ${input.linkedinNote}

Criteria: personalization, brevity, clear CTA, no spam words, no em-dashes, professional tone.
Passing threshold: 70.

Return JSON: { score: number, passed: boolean, issues: string[] }. Plain JSON only.`;

  const message = await anthropic.messages.create({
    model: config.models.qa,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackCost({
    model: config.models.qa,
    jobName: 'qa',
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    leadId: input.leadId,
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  return JSON.parse(raw) as QaOutput;
}
