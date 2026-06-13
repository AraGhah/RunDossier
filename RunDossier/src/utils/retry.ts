const JITTER = 0.25; // ±25 % random jitter prevents thundering-herd on mass retry

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  label = 'operation',
  shouldRetry: (err: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (!shouldRetry(lastError) || attempt >= maxRetries) {
        if (attempt >= maxRetries && shouldRetry(lastError)) {
          console.error(`[retry] ${label} failed after ${maxRetries} attempts: ${lastError.message}`);
        }
        throw lastError;
      }
      const base = Math.pow(4, attempt - 1) * 1_000;
      const spread = base * JITTER * (Math.random() * 2 - 1);
      const delay = Math.max(100, Math.round(base + spread));
      console.warn(
        `[retry] ${label} attempt ${attempt}/${maxRetries} failed (${lastError.message}) — retrying in ${delay} ms`
      );
      await new Promise<void>(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}
