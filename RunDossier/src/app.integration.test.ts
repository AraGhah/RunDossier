import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

describe('API integration', () => {
  const app = createApp();

  it('GET /health returns ok', async () => {
    const { default: http } = await import('node:http');
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.status, 'ok');
      assert.ok(response.headers.get('x-request-id'));
    } finally {
      server.close();
    }
  });

  it('unknown route returns 404 JSON', async () => {
    const { default: http } = await import('node:http');
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/nope`);
      assert.equal(response.status, 404);
      const body = await response.json();
      assert.equal(body.error, 'Not found');
    } finally {
      server.close();
    }
  });

  it('POST /api/auth/token without key returns 401', async () => {
    const { default: http } = await import('node:http');
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.ok([401, 403, 503].includes(response.status));
    } finally {
      server.close();
    }
  });
});
