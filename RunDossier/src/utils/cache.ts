interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** In-process TTL cache for read-heavy, low-risk data (health snapshots, config). */
export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs = 60_000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const healthCache = new TtlCache<{ status: string }>(5_000);
