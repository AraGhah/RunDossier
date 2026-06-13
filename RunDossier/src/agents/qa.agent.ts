import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

const DEFAULT_QA_PROMPT = `You are a cold email QA judge. Score each variant on specificity, human-ness, relevance, and length. Return only valid JSON.`;

export interface QAResult {
  variant_number: number;
  specificity_score: number;
  human_ness_score: number;
  relevance_score: number;
  length_ok: boolean;
  qa_score: number;
  qa_verdict: 'ship' | 'reject';
  qa_reason: string;
}

export async function runQAAgent(
  prospectId: string,
  variants: any[],
  researchBrief: any,
  systemPrompt = DEFAULT_QA_PROMPT
): Promise<QAResult[]> {
  const userMessage = `Score these cold email openers against the research brief.

Research brief: ${JSON.stringify(researchBrief)}

Variants: ${JSON.stringify(variants)}

For each variant return:
[{"variant_number": 1, "specificity_score": 0-10, "human_ness_score": 0-10,
  "relevance_score": 0-10, "length_ok": true/false,
  "qa_score": 0-10, "qa_verdict": "ship"|"reject", "qa_reason": "..."}]`;

  const response = await client.messages.create({
    model: config.researchModel,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = extractTextContent(response.content);

  await logCost({
    agentName: 'qa_agent',
    prospectId,
    model: config.researchModel,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  return parseJsonFromLLM<QAResult[]>(text);
}
