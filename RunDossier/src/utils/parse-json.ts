interface TextBlock { type: 'text'; text: string }
type ContentBlock = TextBlock | { type: string };

export function extractTextContent(content: ContentBlock[]): string {
  const block = content.find(
    (b): b is TextBlock => b.type === 'text' && 'text' in b && Boolean((b as TextBlock).text)
  );
  if (!block) {
    throw new Error('No text content block in model response');
  }
  return block.text;
}

/**
 * Thrown when no valid JSON can be recovered from a model response.
 * Carries the full raw output so callers can persist it for debugging
 * instead of hiding the failure behind a generic message.
 */
export class LLMJsonParseError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(`${message}. Preview: ${JSON.stringify((raw ?? '').slice(0, 500))}`);
    this.name = 'LLMJsonParseError';
    this.raw = raw ?? '';
  }
}

/** Attempt a strict parse, then one safe lenient pass (strip trailing commas). */
function tryParse(candidate: string): unknown {
  const s = candidate.trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    // Lenient: remove trailing commas before } or ] (a common model slip).
    const lenient = s.replace(/,(\s*[}\]])/g, '$1');
    if (lenient !== s) {
      try {
        return JSON.parse(lenient);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/** Yield progressively more aggressive JSON candidates from a raw response. */
function* jsonCandidates(text: string): Generator<string> {
  const trimmed = text.trim();
  yield trimmed;

  // Markdown fences: ```json ... ``` or ``` ... ```
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) yield fence[1];

  // Object embedded in surrounding prose: first { ... last }
  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) yield trimmed.slice(objStart, objEnd + 1);

  // Array embedded in surrounding prose: first [ ... last ]
  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) yield trimmed.slice(arrStart, arrEnd + 1);
}

/**
 * Tolerant JSON parser for AI output. Handles markdown code fences, JSON
 * embedded in surrounding prose, and minor trailing-comma slips. Returns the
 * first candidate that parses; throws LLMJsonParseError (with the raw output)
 * if nothing valid can be recovered. Callers MUST validate the shape before
 * persisting — this only guarantees valid JSON, not a valid structure.
 */
export function parseJsonFromLLM<T>(text: string): T {
  if (!text || !text.trim()) {
    throw new LLMJsonParseError('Model returned an empty response', text ?? '');
  }

  for (const candidate of jsonCandidates(text)) {
    const parsed = tryParse(candidate);
    // Only objects/arrays are useful structures here; ignore bare scalars/null.
    if (parsed !== undefined && parsed !== null && typeof parsed === 'object') {
      return parsed as T;
    }
  }

  throw new LLMJsonParseError(
    `Failed to parse JSON from model output (${text.trim().length} chars)`,
    text
  );
}
