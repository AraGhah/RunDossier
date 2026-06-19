/**
 * Pure helper for safely deduplicating client rows. Encodes the rule used to
 * collapse duplicate "Test Client" rows: keep the canonical/default client when
 * present, otherwise the row with a valid contact email and the most data, and
 * always reassign the duplicates' records onto the survivor BEFORE deletion.
 */

export interface ClientLike {
  id: string;
  contact_email?: string | null;
  client_first_name?: string | null;
  prospects?: number;
  batches?: number;
}

export interface DedupePlan {
  survivorId: string;
  mergeIds: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasValidEmail(c: ClientLike): boolean {
  return Boolean(c.contact_email && EMAIL_RE.test(c.contact_email.trim()));
}

function dataScore(c: ClientLike): number {
  return (c.prospects ?? 0) + (c.batches ?? 0);
}

/**
 * Decide which client survives and which are merged into it.
 * - If `preferredSurvivorId` is given and present, it always wins (the canonical
 *   default client that code depends on).
 * - Otherwise pick the row with a valid email; tie-break by most data.
 * Throws if asked to dedupe fewer than 2 rows (nothing to do) — callers guard.
 */
export function planClientDedupe(clients: ClientLike[], preferredSurvivorId?: string): DedupePlan {
  if (clients.length < 2) {
    throw new Error('planClientDedupe requires at least 2 client rows');
  }

  const preferred = preferredSurvivorId
    ? clients.find(c => c.id === preferredSurvivorId)
    : undefined;

  const survivor =
    preferred ??
    [...clients].sort((a, b) => {
      const ae = hasValidEmail(a) ? 1 : 0;
      const be = hasValidEmail(b) ? 1 : 0;
      if (ae !== be) return be - ae;             // valid email first
      return dataScore(b) - dataScore(a);        // then most data
    })[0];

  return {
    survivorId: survivor.id,
    mergeIds: clients.filter(c => c.id !== survivor.id).map(c => c.id),
  };
}
