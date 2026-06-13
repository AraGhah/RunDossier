import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { stripEmDashes } from '../utils/strip-emdash.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

export interface ResearchBrief {
  name: string;
  title: string;
  research_summary: string;
  top_3_signals: unknown;
}

export interface FirstLineVariant {
  variant_number: number;
  subject: string;
  opener: string;
  bridge: string;
  angle: string;
}

export async function runPersonalizeAgent(
  prospectId: string,
  researchBrief: ResearchBrief,
  systemPrompt: string
): Promise<FirstLineVariant[]> {
  const userMessage = `Generate 3 cold email opener variants for this prospect:
${JSON.stringify(researchBrief)}

Return ONLY a JSON array of 3 objects:
[{"variant_number": 1, "subject": "...", "opener": "...", "bridge": "...", "angle": "..."}]`;

  const response = await client.messages.create({
    model: config.personalizeModel,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = extractTextContent(response.content);

  await logCost({
    agentName: 'personalization_agent',
    prospectId,
    model: config.personalizeModel,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }).catch(err => console.error('[personalize] cost log failed:', err));

  const variants = parseJsonFromLLM<FirstLineVariant[]>(text);

  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error('Personalization agent returned no variants');
  }

  return variants.map(v => ({
    ...v,
    subject: stripEmDashes(v.subject),
    opener: stripEmDashes(v.opener),
    bridge: stripEmDashes(v.bridge),
  }));
}
