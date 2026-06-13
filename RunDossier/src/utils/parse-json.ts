export function extractTextContent(
  content: Array<{ type: string; text?: string }>
): string {
  const block = content.find(b => b.type === 'text' && b.text);
  if (!block?.text) {
    throw new Error('No text content in model response');
  }
  return block.text;
}

export function parseJsonFromLLM<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from model: ${(err as Error).message}. Preview: ${jsonStr.slice(0, 200)}`
    );
  }
}
