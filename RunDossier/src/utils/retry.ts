export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  label = 'operation'
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const delay = Math.pow(4, attempt - 1) * 1000; // 1s, 4s, 16s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
}
