import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { trackCost } from '../utils/cost-tracker.js';
import { stripEmdash } from '../utils/strip-emdash.js';

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export interface ResearchInput {
  leadId: string;
  fullName: string;
  headline: string;
  company: string;
  about: string;
}

export interface ResearchOutput {
  summary: string;
  keyInsights: string[];
  talkingPoints: string[];
}

export async function runResearchAgent(input: ResearchInput): Promise<ResearchOutput> {
  const prompt = `You are a B2B research analyst. Given this LinkedIn profile, extract structured intel for outreach.

Name: ${input.fullName}
Headline: ${input.headline}
Company: ${input.company}
About: ${input.about}

Return JSON with keys: summary (2 sentences), keyInsights (array of 3 strings), talkingPoints (array of 3 strings).
No markdown fences. Plain JSON only.`;

  const message = await anthropic.messages.create({
    model: config.models.research,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackCost({
    model: config.models.research,
    jobName: 'research',
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    leadId: input.leadId,
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const parsed = JSON.parse(raw) as ResearchOutput;

  return {
    summary: stripEmdash(parsed.summary),
    keyInsights: parsed.keyInsights.map(stripEmdash),
    talkingPoints: parsed.talkingPoints.map(stripEmdash),
  };
}
