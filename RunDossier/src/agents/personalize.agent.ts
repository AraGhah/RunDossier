import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { stripEmDashes } from '../utils/strip-emdash.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';
import { validateVariantFields } from '../utils/variant-validation.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

export interface ResearchBrief {
  name: string;
  title: string;
  company?: string;
  research_summary: string;
  top_3_signals: unknown;
}

export interface FirstLineVariant {
  variant_number: number;
  signal_used: string;
  subject: string;
  opener: string;
  bridge: string;
}

interface VariantsWrapper {
  variants?: FirstLineVariant[];
}

export async function runPersonalizeAgent(
  prospectId: string,
  researchBrief: ResearchBrief,
  systemPrompt: string,
  retryNotes = ''
): Promise<FirstLineVariant[]> {
  const userMessage = `Prospect:
Name: ${researchBrief.name}
Title: ${researchBrief.title ?? ''}
Company: ${researchBrief.company ?? ''}

Research brief:
${researchBrief.research_summary}

Top 3 signals:
${JSON.stringify(researchBrief.top_3_signals)}

OUTPUT FORMAT — respond with ONLY a JSON array of exactly ${config.variantCount} objects. No prose, commentary, markdown, or code fences. Each object must have the string keys "signal_used", "subject", "opener", "bridge". Even if the signals feel thin, still return your best ${config.variantCount} variants as JSON (do not explain why — the downstream QA step decides what ships).${retryNotes}`;

  const response = await client.messages.create({
    model: config.personalizeModel,
    max_tokens: 4000,
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

  const parsed = parseJsonFromLLM<FirstLineVariant[] | VariantsWrapper>(text);
  const rawVariants = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.variants)
      ? parsed.variants
      : [];

  if (rawVariants.length === 0) {
    throw new Error('Personalization agent returned no variants');
  }

  const variants: FirstLineVariant[] = rawVariants.map((v, i) => {
    const signal_used = String(
      (v as { signal_used?: string; angle?: string }).signal_used
      ?? (v as { angle?: string }).angle
      ?? 'NONE'
    ).trim();
    const subject = stripEmDashes(String(v.subject ?? '').trim());
    const opener = stripEmDashes(String(v.opener ?? '').trim());
    const bridge = stripEmDashes(String(v.bridge ?? '').trim());
    const variant_number = Number(v.variant_number) || i + 1;

    const validationErr = validateVariantFields(subject, opener, bridge);
    if (validationErr) {
      throw new Error(`Variant ${variant_number} failed validation: ${validationErr}`);
    }

    return { variant_number, signal_used, subject, opener, bridge };
  });

  if (variants.length < config.variantCount) {
    throw new Error(`Expected ${config.variantCount} variants, got ${variants.length}`);
  }

  return variants.slice(0, config.variantCount);
}
