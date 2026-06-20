import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { stripEmDashes } from '../utils/strip-emdash.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';
import { formatSignalsForPrompt, validateVariantFields } from '../utils/variant-validation.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

export interface ResearchBrief {
  name: string;
  title: string;
  company?: string;
  research_summary: string;
  top_3_signals: unknown;
  buying_triggers?: unknown;
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

function buildPersonalizationUserMessage(brief: ResearchBrief, retryNotes: string): string {
  const signalsBlock = formatSignalsForPrompt(brief.top_3_signals);
  const triggers =
    brief.buying_triggers && Array.isArray(brief.buying_triggers) && brief.buying_triggers.length > 0
      ? `\nBuying triggers (use only if grounded in signals above):\n${JSON.stringify(brief.buying_triggers, null, 2)}`
      : '';

  return `# Prospect profile
Name: ${brief.name}
Title: ${brief.title ?? ''}
Company: ${brief.company ?? ''}

# Research summary
${brief.research_summary}

# Verifiable signals (each variant must anchor on a DIFFERENT signal)
${signalsBlock}
${triggers}

# Your task
Write exactly ${config.variantCount} distinct first-line variants. Each variant must:
1. Use ONE specific signal from above (set signal_used to a short label matching that signal)
2. Open with a concrete observation a stranger could only know from this research — not flattery, not a pitch
3. Bridge naturally to outbound / pipeline / deliverability / personalization (Preframe's domain)
4. Feel like a sharp SDR wrote it in 30 seconds — casual, specific, zero AI slop

# Output format
Return ONLY valid JSON — no markdown, no preamble:
{
  "variants": [
    { "variant_number": 1, "signal_used": "...", "subject": "...", "opener": "...", "bridge": "..." },
    { "variant_number": 2, "signal_used": "...", "subject": "...", "opener": "...", "bridge": "..." },
    { "variant_number": 3, "signal_used": "...", "subject": "...", "opener": "...", "bridge": "..." }
  ]
}

If no signal is specific enough, set signal_used to "NONE" for that variant — do not invent facts.${retryNotes}`;
}

export async function runPersonalizeAgent(
  prospectId: string,
  researchBrief: ResearchBrief,
  systemPrompt: string,
  retryNotes = ''
): Promise<FirstLineVariant[]> {
  const userMessage = buildPersonalizationUserMessage(researchBrief, retryNotes);

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
  }).catch((err) => console.error('[personalize] cost log failed:', err));

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
      (v as { signal_used?: string; angle?: string }).signal_used ??
        (v as { angle?: string }).angle ??
        'NONE'
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
