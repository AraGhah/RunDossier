export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetMs?: number;
  name?: string;
}

/** Lightweight circuit breaker for external API calls (Anthropic, Apify, etc.). */
export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = 'closed';
  private openedAt = 0;

  constructor(private options: CircuitBreakerOptions = {}) {}

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= (this.options.resetMs ?? 30_000)) {
      this.state = 'half-open';
    }
    return this.state;
  }

  async exec<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === 'open') {
      if (fallback) return fallback();
      throw new Error(`Circuit open: ${this.options.name ?? 'external-service'}`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback && this.state === 'open') return fallback();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    const threshold = this.options.failureThreshold ?? 5;
    if (this.failures >= threshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}
