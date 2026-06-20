import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

async function withServer(
  handler: (port: number) => Promise<void>
): Promise<void> {
  const { default: http } = await import('node:http');
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  try {
    await handler(port);
  } finally {
    server.close();
  }
}

describe('API integration', () => {
  it('GET /health returns ok', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.status, 'ok');
      assert.ok(response.headers.get('x-request-id'));
    });
  });

  it('unknown route returns 404 JSON', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/nope`);
      assert.equal(response.status, 404);
      const body = await response.json();
      assert.equal(body.error, 'Not found');
    });
  });

  it('GET /.well-known/security.txt returns RFC 9116 contact', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/.well-known/security.txt`);
      assert.equal(response.status, 200);
      const text = await response.text();
      assert.match(text, /Contact: mailto:/);
      assert.match(text, /Expires:/);
    });
  });

  it('POST /api/auth/token without key returns 401', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.ok([401, 403, 503].includes(response.status));
    });
  });

  it('POST /api/telegram/webhook rejects invalid update', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.ok([400, 503].includes(response.status));
    });
  });

  it('POST /api/telegram/webhook accepts valid update shape', async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          update_id: 999999001,
          message: {
            message_id: 1,
            chat: { id: 1, type: 'private' },
            text: '/help',
            date: Math.floor(Date.now() / 1000),
          },
        }),
      });
      assert.ok([200, 503].includes(response.status));
      if (response.status === 200) {
        const body = await response.json();
        assert.equal(body.ok, true);
      }
    });
  });
});
