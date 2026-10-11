import { describe, it, expect } from 'vitest';
import { buildFinalUrl, buildHeaders, redactHeaders } from '../src/services/requestExecutor';

describe('Request Executor Utilities', () => {
  it('builds final URL with query parameters', () => {
    const url = buildFinalUrl('https://api.example.com/items', [
      { key: 'page', value: '1', enabled: true },
      { key: 'sort', value: 'desc', enabled: true },
      { key: 'filter', value: 'active', enabled: false },
    ]);
    expect(url).toBe('https://api.example.com/items?page=1&sort=desc');
  });

  it('builds headers and ignores disabled headers', () => {
    const headers = buildHeaders([
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'X-Custom-Header', value: 'my-value', enabled: true },
      { key: 'X-Disabled', value: 'ignore', enabled: false },
    ]);
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'X-Custom-Header': 'my-value',
    });
  });

  it('redacts sensitive headers', () => {
    const headers = {
      Authorization: 'Bearer secret_token',
      'X-API-Key': 'secret_key',
      'Content-Type': 'application/json',
      Cookie: 'session=xyz',
    };
    const redacted = redactHeaders(headers);
    expect(redacted).toEqual({
      Authorization: '[REDACTED]',
      'X-API-Key': '[REDACTED]',
      'Content-Type': 'application/json',
      Cookie: '[REDACTED]',
    });
  });

  it('correctly handles request timeouts and produces descriptive error', async () => {
    const { executeRequest } = await import('../src/services/requestExecutor');
    // Using an unreachable public IP or a delayed request with 100ms timeout
    const result = await executeRequest({
      url: 'https://httpbin.org/delay/5',
      method: 'GET',
      timeoutMs: 100,
    });
    expect(result.status).toBe(0);
    expect(result.error).toMatch(/timed out after 100ms|blocked/i);
  });
});
