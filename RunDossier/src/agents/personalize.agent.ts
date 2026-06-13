import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { trackCost } from '../utils/cost-tracker.js';
import { stripEmdash } from '../utils/strip-emdash.js';

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export interface PersonalizeInput {
  leadId: string;
  fullName: string;
  company: string;
  talkingPoints: string[];
  researchSummary: string;
}

export interface PersonalizeOutput {
  subject: string;
  emailBody: string;
  linkedinNote: string;
}

export async function runPersonalizeAgent(input: PersonalizeInput): Promise<PersonalizeOutput> {
  const prompt = `You are an expert B2B copywriter. Write a cold outreach email and a short LinkedIn note.

Prospect: ${input.fullName} at ${input.company}
Research summary: ${input.researchSummary}
Key talking points: ${input.talkingPoints.join('; ')}

Rules:
- Email subject line: max 8 words, no clickbait
- Email body: 3 short paragraphs, under 120 words total, no em-dashes
- LinkedIn note: max 300 characters

Return JSON with keys: subject, emailBody, linkedinNote. Plain JSON, no markdown.`;

  const message = await anthropic.messages.create({
    model: config.models.personalize,
    max_tokens: 768,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackCost({
    model: config.models.personalize,
    jobName: 'personalize',
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    leadId: input.leadId,
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const parsed = JSON.parse(raw) as PersonalizeOutput;

  return {
    subject: stripEmdash(parsed.subject),
    emailBody: stripEmdash(parsed.emailBody),
    linkedinNote: stripEmdash(parsed.linkedinNote),
  };
}
