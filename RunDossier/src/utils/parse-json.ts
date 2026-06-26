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

/** Attempt a strict parse, then progressively more lenient passes. */
function tryParse(candidate: string): unknown {
  const s = candidate.trim();
  if (!s) return undefined;

  // Pass 1: strict
  try { return JSON.parse(s); } catch { /* fall through */ }

  // Pass 2: strip trailing commas (common model slip)
  const lenient = s.replace(/,(\s*[}\]])/g, '$1');
  if (lenient !== s) {
    try { return JSON.parse(lenient); } catch { /* fall through */ }
  }

  // Pass 3: escape malformed \uXXXX sequences (e.g. Arabic names reflected back
  // by the LLM with broken escapes like \u followed by non-hex chars)
  const base = lenient !== s ? lenient : s;
  const fixed = base.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
  if (fixed !== base) {
    try { return JSON.parse(fixed); } catch { /* fall through */ }
  }

  return undefined;
}

/** Yield progressively more aggressive JSON candidates from a raw response. */
function* jsonCandidates(text: string): Generator<string> {
  const trimmed = text.trim();
  yield trimmed;

  // Markdown fences: ```json ... ``` or ``` ... ```
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) yield fence[1];

  // JSON embedded in surrounding prose: slice the outermost { } or [ ].
  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  const objSlice = objStart !== -1 && objEnd > objStart ? trimmed.slice(objStart, objEnd + 1) : null;
  const arrSlice = arrStart !== -1 && arrEnd > arrStart ? trimmed.slice(arrStart, arrEnd + 1) : null;

  // Prefer whichever structure's opening bracket appears first (the outermost one),
  // so an array of objects isn't mis-extracted as just its first object.
  const arrayFirst = arrStart !== -1 && (objStart === -1 || arrStart < objStart);
  for (const slice of arrayFirst ? [arrSlice, objSlice] : [objSlice, arrSlice]) {
    if (slice) yield slice;
  }
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
