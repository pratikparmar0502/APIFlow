import { describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAME } from '../src/utils/auth';
import { requireCsrfProtection } from '../src/middleware/csrf';
import { corsMiddleware, isAllowedBrowserOrigin } from '../src/middleware/cors';

function responseRecorder() {
  const result = { statusCode: 200, body: undefined as unknown };
  const response = {
    status: vi.fn((statusCode: number) => {
      result.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      result.body = body;
      return response;
    }),
  };
  return { response, result };
}

describe('cookie request protections', () => {
  it('allows safe methods and bearer clients, but rejects unsafe cookie requests without an approved Origin', () => {
    const next = vi.fn();
    const denied = responseRecorder();
    requireCsrfProtection({ method: 'POST', cookies: { [AUTH_COOKIE_NAME]: 'cookie' }, headers: {} } as any, denied.response as any, next);
    expect(denied.result.statusCode).toBe(403);
    expect(denied.result.body).toMatchObject({ code: 'CSRF_ORIGIN_REJECTED' });
    expect(next).not.toHaveBeenCalled();

    requireCsrfProtection({ method: 'POST', cookies: { [AUTH_COOKIE_NAME]: 'cookie' }, headers: { origin: 'http://localhost:5173' } } as any, {} as any, next);
    requireCsrfProtection({ method: 'POST', cookies: {}, headers: { authorization: 'Bearer token' } } as any, {} as any, next);
    requireCsrfProtection({ method: 'GET', cookies: { [AUTH_COOKIE_NAME]: 'cookie' }, headers: {} } as any, {} as any, next);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('allows only configured/development browser origins and surfaces rejected CORS origins as forbidden', () => {
    expect(isAllowedBrowserOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedBrowserOrigin('https://untrusted.example')).toBe(false);

    // cors exposes its callback through the middleware invocation, so exercise the actual middleware.
    const req = { headers: { origin: 'https://untrusted.example', 'access-control-request-method': 'POST' }, method: 'OPTIONS' };
    const { response, result } = responseRecorder();
    corsMiddleware(req as any, response as any, (error?: Error) => {
      if (error) {
        result.statusCode = (error as Error & { status?: number }).status || 500;
        result.body = { code: (error as Error & { code?: string }).code };
      }
    });
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({ code: 'CORS_ORIGIN_REJECTED' });
  });
});
