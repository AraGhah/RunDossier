import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeliveryEvent } from './delivery-events.js';

describe('buildDeliveryEvent', () => {
  it('builds a full audit row with JSON-encoded metadata', () => {
    const row = buildDeliveryEvent({
      deliveryId: 'd1',
      clientId: 'c1',
      eventType: 'emailed',
      status: 'email_sent',
      metadata: { recipient: 'x@y.com', prospect_count: 3 },
    });
    assert.equal(row.delivery_id, 'd1');
    assert.equal(row.client_id, 'c1');
    assert.equal(row.event_type, 'emailed');
    assert.equal(row.status, 'email_sent');
    assert.equal(row.metadata, '{"recipient":"x@y.com","prospect_count":3}');
    assert.equal(row.error, null);
  });

  it('nulls metadata when absent and truncates long errors', () => {
    const row = buildDeliveryEvent({
      deliveryId: null,
      clientId: 'c1',
      eventType: 'failed',
      status: 'email_failed',
      error: 'e'.repeat(2000),
    });
    assert.equal(row.metadata, null);
    assert.equal(row.delivery_id, null);
    assert.equal(row.error?.length, 1000);
  });
});
