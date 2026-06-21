import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

const SYSTEM_PROMPT =
  "You convert a B2B founder's free-text description of their ideal customer profile (ICP) " +
  'into a structured JSON brief used to source LinkedIn prospects. Be faithful to what they ' +
  'wrote; never invent constraints they did not state. Return ONLY valid JSON, no prose.';

export interface ParsedIcp {
  search_query: string;
  titles: string[];
  industries: string[];
  locations: string[];
  company_size: string;
  keywords: string[];
  exclusions: string[];
  offer: string;
  summary: string;
}

export async function parseIcpBrief(brief: string): Promise<ParsedIcp> {
  const userMessage =
    'Free-text ICP brief from the client:\n"""\n' +
    brief +
    '\n"""\n\nReturn ONLY JSON matching this schema:\n' +
    '{\n' +
    '  "search_query": "a concise LinkedIn search phrase, role + niche, e.g. lead generation agency founder",\n' +
    '  "titles": ["job titles to target"],\n' +
    '  "industries": ["industries"],\n' +
    '  "locations": ["countries or cities"],\n' +
    '  "company_size": "e.g. 1-10, 11-50, or empty if unspecified",\n' +
    '  "keywords": ["niche keywords"],\n' +
    '  "exclusions": ["who to exclude"],\n' +
    '  "offer": "what the client sells / their value proposition",\n' +
    '  "summary": "one sentence describing who we will target"\n' +
    '}';

  const response = await client.messages.create({
    model: config.researchModel,
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const parsed = parseJsonFromLLM<Partial<ParsedIcp>>(extractTextContent(response.content));
  return {
    search_query: (parsed.search_query ?? '').trim(),
    titles: parsed.titles ?? [],
    industries: parsed.industries ?? [],
    locations: parsed.locations ?? [],
    company_size: parsed.company_size ?? '',
    keywords: parsed.keywords ?? [],
    exclusions: parsed.exclusions ?? [],
    offer: parsed.offer ?? '',
    summary: (parsed.summary ?? '').trim(),
  };
}
