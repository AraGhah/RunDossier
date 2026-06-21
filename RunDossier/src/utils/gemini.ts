import { config } from '../config.js';

interface GeminiUsage {
  inputTokens: number;
  outputTokens: number;
}

interface GeminiGenerateResult {
  text: string;
  usage: GeminiUsage;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string };
}

/** Call Gemini generateContent (W4.5 QA judge). model accepts any model id. */
export async function geminiGenerateContent(
  systemPrompt: string,
  userPrompt: string,
  model: string = config.qaModel
): Promise<GeminiGenerateResult> {
  const apiKey = config.googleApiKey;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY (required for W4.5 QA agent)');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Gemini API HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) {
    throw new Error('Gemini returned empty content');
  }

  return {
    text,
    usage: {
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
