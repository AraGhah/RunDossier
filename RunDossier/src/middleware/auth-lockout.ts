/**
 * ITSAP.60.005 — lock accounts / delay logins after repeated failed auth attempts.
 * In-memory store (single instance). Use Redis for multi-instance deployments.
 */
const failures = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

export const AUTH_LOCKOUT_MAX_FAILURES = 5;
export const AUTH_LOCKOUT_WINDOW_MS = 15 * 60_000;
export const AUTH_LOCKOUT_DURATION_MS = 15 * 60_000;

function prune(key: string, now: number): void {
  const entry = failures.get(key);
  if (!entry) return;
  if (entry.lockedUntil > 0 && now >= entry.lockedUntil) {
    failures.delete(key);
    return;
  }
  if (entry.lockedUntil === 0 && now - entry.firstAt > AUTH_LOCKOUT_WINDOW_MS) {
    failures.delete(key);
  }
}

export function isAuthLocked(key: string): { locked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  prune(key, now);
  const entry = failures.get(key);
  if (!entry?.lockedUntil || entry.lockedUntil <= now) {
    return { locked: false };
  }
  return {
    locked: true,
    retryAfterSec: Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000)),
  };
}

export function recordAuthFailure(key: string): { locked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  prune(key, now);
  const entry = failures.get(key) ?? { count: 0, firstAt: now, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count === 1) entry.firstAt = now;
  if (entry.count >= AUTH_LOCKOUT_MAX_FAILURES) {
    entry.lockedUntil = now + AUTH_LOCKOUT_DURATION_MS;
  }
  failures.set(key, entry);
  return isAuthLocked(key);
}

export function clearAuthFailures(key: string): void {
  failures.delete(key);
}

/** Test helper */
export function resetAuthLockoutStore(): void {
  failures.clear();
}
