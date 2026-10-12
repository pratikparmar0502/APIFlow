import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  executeRequest: vi.fn(),
}));

vi.mock('../src/models/User', () => ({
  User: { findById: mocks.findById },
}));
vi.mock('../src/services/requestExecutor', () => ({
  buildFinalUrl: (url: string) => url,
  buildHeaders: () => ({}),
  redactHeaders: (headers: Record<string, string>) => headers,
  executeRequest: mocks.executeRequest,
}));

import { createApp } from '../src/app';
import { generateToken, AUTH_COOKIE_NAME } from '../src/utils/auth';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  mocks.findById.mockReturnValue({ lean: async () => ({ _id: 'user-a', status: 'active' }) });
  mocks.executeRequest.mockResolvedValue({
    status: 200,
    headers: {},
    body: '{"ok":true}',
    bodyTruncated: false,
    durationMs: 1,
  });
  server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start test server');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const requestBody = { url: 'https://public.example.test', method: 'GET' };

describe('POST /api/v1/requests/execute', () => {
  it('rejects an unauthenticated execution request before the outbound executor is called', async () => {
    const response = await fetch(`${baseUrl}/api/v1/requests/execute`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestBody),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(mocks.executeRequest).not.toHaveBeenCalled();
  });

  it('allows an authenticated bearer client and blocks an unapproved cookie-session origin before execution', async () => {
    const token = generateToken({ userId: 'user-a', email: 'a@example.test' });
    const authorized = await fetch(`${baseUrl}/api/v1/requests/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(requestBody),
    });
    expect(authorized.status).toBe(200);
    expect(mocks.executeRequest).toHaveBeenCalledTimes(1);

    const csrfDenied = await fetch(`${baseUrl}/api/v1/requests/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${token}`,
        origin: 'https://untrusted.example',
      },
      body: JSON.stringify(requestBody),
    });
    expect(csrfDenied.status).toBe(403);
    expect(await csrfDenied.json()).toMatchObject({ code: 'CORS_ORIGIN_REJECTED' });
    expect(mocks.executeRequest).toHaveBeenCalledTimes(1);
  });
});
