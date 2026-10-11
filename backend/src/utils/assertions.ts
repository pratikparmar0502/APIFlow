import { AssertionConfig, AssertionResult, ExecuteRequestResult } from '../types';
import { extractJsonPath } from './variables';

export function evaluateAssertions(
  assertions: AssertionConfig[],
  response: ExecuteRequestResult
): AssertionResult[] {
  return assertions.map(assertion => evaluateAssertion(assertion, response));
}

function evaluateAssertion(
  assertion: AssertionConfig,
  response: ExecuteRequestResult
): AssertionResult {
  const base = {
    assertionId: assertion.id,
    type: assertion.type,
    description: assertion.description,
  };

  try {
    switch (assertion.type) {
      case 'status': {
        const actual = response.status;
        const expected = Number(assertion.expected);
        const result = compareValues(actual, assertion.operator || 'eq', expected);
        return {
          ...base,
          passed: result,
          expected: assertion.expected,
          actual,
          message: result
            ? `Status ${actual} matches expected ${assertion.expected}`
            : `Expected status ${assertion.operator || 'eq'} ${assertion.expected}, got ${actual}`,
        };
      }

      case 'jsonPath': {
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.body);
        } catch {
          return { ...base, passed: false, message: 'Response body is not valid JSON', actual: response.body };
        }
        const { value, found } = extractJsonPath(parsed, assertion.target || '$');
        if (!found) {
          return { ...base, passed: false, message: `JSON path "${assertion.target}" not found`, actual: undefined };
        }
        const expected = parseExpectedValue(assertion.expected);
        const result = compareValues(value, assertion.operator || 'eq', expected);
        return {
          ...base,
          passed: result,
          expected: assertion.expected,
          actual: value,
          message: result
            ? `JSON path "${assertion.target}" assertion passed`
            : `JSON path "${assertion.target}": expected ${String(assertion.expected)}, got ${JSON.stringify(value)}`,
        };
      }

      case 'exists': {
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.body);
        } catch {
          return { ...base, passed: false, message: 'Response body is not valid JSON' };
        }
        const { found } = extractJsonPath(parsed, assertion.target || '$');
        return {
          ...base,
          passed: found,
          message: found
            ? `JSON path "${assertion.target}" exists`
            : `JSON path "${assertion.target}" does not exist`,
        };
      }

      case 'typeCheck': {
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.body);
        } catch {
          return { ...base, passed: false, message: 'Response body is not valid JSON' };
        }
        const { value, found } = extractJsonPath(parsed, assertion.target || '$');
        if (!found) {
          return { ...base, passed: false, message: `JSON path "${assertion.target}" not found` };
        }
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        const expectedType = String(assertion.expected).toLowerCase();
        const passed = actualType === expectedType;
        return {
          ...base,
          passed,
          expected: expectedType,
          actual: actualType,
          message: passed
            ? `Type check passed: "${assertion.target}" is ${actualType}`
            : `Expected type ${expectedType}, got ${actualType} at "${assertion.target}"`,
        };
      }

      case 'responseTime': {
        const threshold = Number(assertion.expected);
        const actual = response.durationMs;
        const passed = actual <= threshold;
        return {
          ...base,
          passed,
          expected: threshold,
          actual,
          message: passed
            ? `Response time ${actual}ms is within ${threshold}ms`
            : `Response time ${actual}ms exceeds threshold ${threshold}ms`,
        };
      }

      default:
        return { ...base, passed: false, message: `Unknown assertion type: ${(assertion as AssertionConfig).type}` };
    }
  } catch (err) {
    return {
      ...base,
      passed: false,
      message: `Assertion evaluation error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

function parseExpectedValue(expected: string | number | boolean | undefined): unknown {
  if (typeof expected === 'number' || typeof expected === 'boolean') return expected;
  if (typeof expected === 'string') {
    if (expected === 'true') return true;
    if (expected === 'false') return false;
    if (expected === 'null') return null;
    const num = Number(expected);
    if (!isNaN(num) && expected.trim() !== '') return num;
    return expected;
  }
  return expected;
}

function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'lt': return (actual as number) < (expected as number);
    case 'lte': return (actual as number) <= (expected as number);
    case 'gt': return (actual as number) > (expected as number);
    case 'gte': return (actual as number) >= (expected as number);
    case 'contains':
      if (typeof actual === 'string') return actual.includes(String(expected));
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    case 'exists': return actual !== undefined && actual !== null;
    default: return false;
  }
}
