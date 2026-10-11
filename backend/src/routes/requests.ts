import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { executeRequest, buildFinalUrl, buildHeaders, redactHeaders } from '../services/requestExecutor';
import { interpolateVariables, extractJsonPath, validateVariableName } from '../utils/variables';
import { evaluateAssertions } from '../utils/assertions';
import { ExtractionRule, ExtractionResult } from '../types';

const router = Router();

const QueryParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});

const HeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});

const AssertionConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['status', 'jsonPath', 'exists', 'typeCheck', 'responseTime']),
  target: z.string().optional(),
  operator: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains', 'exists']).optional(),
  expected: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional(),
});

const ExtractionRuleSchema = z.object({
  id: z.string(),
  variableName: z.string(),
  source: z.enum(['responseJson', 'responseHeader', 'responseStatus']),
  jsonPath: z.string().optional(),
  headerName: z.string().optional(),
});

const ExecuteRequestSchema = z.object({
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
  queryParams: z.array(QueryParamSchema).default([]),
  headers: z.array(HeaderSchema).default([]),
  body: z.string().optional(),
  timeoutMs: z.number().min(100).max(60000).optional(),
  assertions: z.array(AssertionConfigSchema).default([]),
  extractionRules: z.array(ExtractionRuleSchema).default([]),
  variables: z.record(z.unknown()).default({}),
});

router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = ExecuteRequestSchema.parse(req.body);
    const variables = input.variables;

    // Interpolate variables
    const { result: interpolatedUrl, missingVars: urlMissing } = interpolateVariables(input.url, variables);
    if (urlMissing.length > 0) {
      res.status(400).json({
        code: 'MISSING_VARIABLES',
        message: `Missing variables in URL: ${urlMissing.join(', ')}`,
      });
      return;
    }

    const resolvedParams = input.queryParams.map(p => ({
      ...p,
      value: interpolateVariables(p.value, variables).result,
      key: interpolateVariables(p.key, variables).result,
    }));
    const finalUrl = buildFinalUrl(interpolatedUrl, resolvedParams);

    const resolvedHeaders = input.headers.map(h => ({
      ...h,
      value: interpolateVariables(h.value, variables).result,
    }));
    const headerMap = buildHeaders(resolvedHeaders);

    let resolvedBody: string | undefined;
    if (input.body) {
      resolvedBody = interpolateVariables(input.body, variables).result;
    }

    const response = await executeRequest({
      url: finalUrl,
      method: input.method,
      headers: headerMap,
      body: resolvedBody,
      timeoutMs: input.timeoutMs,
    });

    const assertionResults = evaluateAssertions(input.assertions, response);
    const extractionResults = runExtractions(input.extractionRules, response);

    res.json({
      requestUrl: finalUrl,
      requestMethod: input.method,
      status: response.status,
      headers: redactHeaders(response.headers),
      body: response.body.slice(0, 50000), // Preview limit
      bodyTruncated: response.bodyTruncated || response.body.length > 50000,
      durationMs: response.durationMs,
      error: response.error,
      assertionResults,
      extractionResults,
    });
  } catch (err) {
    next(err);
  }
});

function runExtractions(
  rules: ExtractionRule[],
  response: { status: number; headers: Record<string, string>; body: string }
): ExtractionResult[] {
  return rules.map(rule => {
    if (!validateVariableName(rule.variableName)) {
      return { variableName: rule.variableName, value: undefined, success: false, error: 'Invalid variable name' };
    }

    try {
      switch (rule.source) {
        case 'responseStatus':
          return { variableName: rule.variableName, value: response.status, success: true };

        case 'responseHeader': {
          if (!rule.headerName) {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'headerName is required' };
          }
          const headerValue = response.headers[rule.headerName.toLowerCase()];
          if (headerValue === undefined) {
            return { variableName: rule.variableName, value: undefined, success: false, error: `Header "${rule.headerName}" not found` };
          }
          return { variableName: rule.variableName, value: headerValue, success: true };
        }

        case 'responseJson': {
          if (!rule.jsonPath) {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'jsonPath is required' };
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(response.body);
          } catch {
            return { variableName: rule.variableName, value: undefined, success: false, error: 'Response is not valid JSON' };
          }
          const { value, found } = extractJsonPath(parsed, rule.jsonPath);
          if (!found) {
            return { variableName: rule.variableName, value: undefined, success: false, error: `JSON path "${rule.jsonPath}" not found` };
          }
          return { variableName: rule.variableName, value, success: true };
        }

        default:
          return { variableName: rule.variableName, value: undefined, success: false, error: `Unknown source: ${rule.source}` };
      }
    } catch (err) {
      return {
        variableName: rule.variableName,
        value: undefined,
        success: false,
        error: err instanceof Error ? err.message : 'Extraction error',
      };
    }
  });
}

export default router;
