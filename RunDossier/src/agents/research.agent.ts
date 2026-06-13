import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

const DEFAULT_SYSTEM_PROMPT = `You are a B2B prospect researcher. Analyze LinkedIn and podcast data to produce actionable sales intelligence. Return only valid JSON.`;

export interface ResearchOutput {
  top_3_signals: { signal: string; source: string; date: string }[];
  buying_triggers: string[];
  research_summary: string;
  confidence_score: number;
}

export async function runResearchAgent(
  prospectId: string,
  linkedInData: any,
  podcastData: any[],
  systemPrompt = DEFAULT_SYSTEM_PROMPT
): Promise<ResearchOutput> {
  const userMessage = `Research this prospect:
LinkedIn data: ${JSON.stringify(linkedInData)}
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

  return parseJsonFromLLM<ResearchOutput>(text);
}
