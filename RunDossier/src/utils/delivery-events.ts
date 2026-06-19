import { query } from '../db.js';

export type DeliveryEventType =
  | 'created'
  | 'ready'
  | 'emailed'
  | 'failed'
  | 'retried'
  | 'skipped';

export interface DeliveryEventInput {
  deliveryId: string | null;
  clientId: string;
  eventType: DeliveryEventType;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  error?: string | null;
}

export interface DeliveryEventRow {
  delivery_id: string | null;
  client_id: string;
  event_type: DeliveryEventType;
  status: string | null;
  metadata: string | null;
  error: string | null;
}

/** Pure: build the audit row payload (testable without a database). */
export function buildDeliveryEvent(input: DeliveryEventInput): DeliveryEventRow {
  return {
    delivery_id: input.deliveryId,
    client_id: input.clientId,
    event_type: input.eventType,
    status: input.status ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    error: input.error ? input.error.slice(0, 1000) : null,
  };
}

/**
 * Append an audit row for a delivery lifecycle event. Never throws — the audit
 * trail must never break the delivery flow itself.
 */
export async function recordDeliveryEvent(input: DeliveryEventInput): Promise<void> {
  const row = buildDeliveryEvent(input);
  await query(
    `INSERT INTO delivery_events (delivery_id, client_id, event_type, status, metadata, error)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [row.delivery_id, row.client_id, row.event_type, row.status, row.metadata, row.error]
  ).catch(err => console.error('[delivery-events] insert error:', (err as Error).message));
}
