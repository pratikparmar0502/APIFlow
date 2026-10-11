import { config } from '../config/env';
import { validateOutboundUrl } from '../utils/ssrf';
import { ExecuteRequestInput, ExecuteRequestResult, Header, QueryParam } from '../types';

const SENSITIVE_HEADERS = new Set([
  'authorization', 'cookie', 'set-cookie', 'x-api-key', 'api-key',
  'x-auth-token', 'x-access-token', 'x-secret-key',
]);

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return redacted;
}

export function buildFinalUrl(
  baseUrl: string,
  queryParams: QueryParam[]
): string {
  const enabledParams = queryParams.filter(p => p.enabled && p.key.trim());
  if (enabledParams.length === 0) return baseUrl;
  
  const url = new URL(baseUrl);
  for (const param of enabledParams) {
    url.searchParams.append(param.key, param.value);
  }
  return url.toString();
}

export function buildHeaders(headers: Header[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    if (h.enabled && h.key.trim()) {
      result[h.key.trim()] = h.value;
    }
  }
  return result;
}

export async function executeRequest(
  input: ExecuteRequestInput
): Promise<ExecuteRequestResult> {
  const startTime = Date.now();

  // Validate destination (SSRF protection)
  try {
    await validateOutboundUrl(input.url);
  } catch (err) {
    return {
      status: 0,
      headers: {},
      body: '',
      bodyTruncated: false,
      durationMs: Date.now() - startTime,
      error: `Request blocked: ${err instanceof Error ? err.message : 'Security validation failed'}`,
    };
  }

  const timeoutMs = Math.min(
    input.timeoutMs || config.maxRequestTimeoutMs,
    config.maxRequestTimeoutMs
  );

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method: input.method,
      headers: input.headers || {},
      signal: controller.signal,
      redirect: 'manual', // Disable automatic redirects for SSRF safety
    };

    const shouldHaveBody = !['GET', 'HEAD', 'DELETE'].includes(input.method);
    if (shouldHaveBody && input.body) {
      fetchOptions.body = input.body;
    }

    const response = await fetch(input.url, fetchOptions);
    const durationMs = Date.now() - startTime;
    clearTimeout(timeoutHandle);

    // Handle redirects manually (validate redirect target)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        try {
          await validateOutboundUrl(new URL(location, input.url).toString());
        } catch {
          return {
            status: response.status,
            headers: responseHeadersToObject(response.headers),
            body: '',
            bodyTruncated: false,
            durationMs,
            error: `Redirect to unsafe destination blocked`,
          };
        }
      }
    }

    // Read response body with size limit
    const maxSize = config.maxResponseSizeBytes;
    let body = '';
    let bodyTruncated = false;

    const responseBody = response.body;
    if (responseBody) {
      const reader = responseBody.getReader();
      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalSize += value.length;
          if (totalSize > maxSize) {
            bodyTruncated = true;
            // Include data up to the limit
            const remaining = maxSize - (totalSize - value.length);
            chunks.push(value.slice(0, remaining));
            await reader.cancel();
            break;
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const decoder = new TextDecoder();
      body = chunks.map(c => decoder.decode(c, { stream: true })).join('');
    }

    const headers = responseHeadersToObject(response.headers);

    return {
      status: response.status,
      headers,
      body,
      bodyTruncated,
      durationMs,
    };
  } catch (err) {
    clearTimeout(timeoutHandle);
    const durationMs = Date.now() - startTime;

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          status: 0,
          headers: {},
          body: '',
          bodyTruncated: false,
          durationMs,
          error: `Request timed out after ${timeoutMs}ms`,
        };
      }
      return {
        status: 0,
        headers: {},
        body: '',
        bodyTruncated: false,
        durationMs,
        error: `Network error: ${err.message}`,
      };
    }

    return {
      status: 0,
      headers: {},
      body: '',
      bodyTruncated: false,
      durationMs,
      error: 'Unknown error occurred',
    };
  }
}

function responseHeadersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
