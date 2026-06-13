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

export function parseJsonFromLLM<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Model returned an empty response');
  }

  // Strip optional markdown fences: ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = (fenced ? fenced[1] : trimmed).trim();

  if (!jsonStr) {
    throw new Error('Model returned no JSON content after stripping fences');
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from model: ${(err as Error).message}. Preview: "${jsonStr.slice(0, 300)}"`
    );
  }
}
