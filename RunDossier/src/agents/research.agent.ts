import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

const DEFAULT_SYSTEM_PROMPT =
  'You are a B2B research analyst. Read LinkedIn, Apollo enrichment, and podcast data to identify the 3 strongest personalization hooks for cold outbound email. Rank signals by recency, specificity, and emotional salience. Discard generic facts. Do not invent signals. Return only valid JSON.';

export interface ResearchSignal {
  signal: string;
  source: string;
  date: string;
}

export interface ResearchOutput {
  top_3_signals: ResearchSignal[];
  buying_triggers: string[];
  research_summary: string;
  confidence_score: number;
}

export async function runResearchAgent(
  prospectId: string,
  linkedInData: Record<string, unknown>,
  apolloData: Record<string, unknown> | null,
  podcastData: Record<string, unknown>[],
  systemPrompt = DEFAULT_SYSTEM_PROMPT
): Promise<ResearchOutput> {
  const userMessage = `Research this prospect:
LinkedIn data: ${JSON.stringify(linkedInData)}
Apollo enrichment: ${JSON.stringify(apolloData ?? {})}
Podcast appearances: ${JSON.stringify(podcastData)}

Return ONLY valid JSON matching this schema:
{
  "top_3_signals": [{"signal": "...", "source": "...", "date": "..."}],
  "buying_triggers": ["..."],
  "research_summary": "...",
  "confidence_score": 0-100
}`;

  const response = await client.messages.create({
    model: config.researchModel,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = extractTextContent(response.content);

  await logCost({
    agentName: 'research_agent',
    prospectId,
    model: config.researchModel,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const output = parseJsonFromLLM<ResearchOutput>(text);

  if (
    !Array.isArray(output.top_3_signals) ||
    typeof output.research_summary !== 'string' ||
    typeof output.confidence_score !== 'number'
  ) {
    throw new Error('Research agent returned malformed JSON — missing required fields');
  }

  return output;
}
