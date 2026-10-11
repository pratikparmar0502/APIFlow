import { describe, it, expect } from 'vitest';
import { evaluateAssertions } from '../src/utils/assertions';
import { AssertionConfig, ExecuteRequestResult } from '../src/types';

describe('Assertion Evaluation Engine', () => {
  const mockResponse: ExecuteRequestResult = {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      code: 200,
      data: {
        id: 10,
        username: 'john_doe',
        score: 95.5,
        isActive: true,
        tags: ['api', 'flow'],
      },
    }),
    bodyTruncated: false,
    durationMs: 120,
  };

  it('evaluates status code assertions', () => {
    const assertions: AssertionConfig[] = [
      { id: '1', type: 'status', operator: 'eq', expected: 200 },
      { id: '2', type: 'status', operator: 'neq', expected: 400 },
      { id: '3', type: 'status', operator: 'lt', expected: 300 },
    ];

    const results = evaluateAssertions(assertions, mockResponse);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('evaluates jsonPath assertions', () => {
    const assertions: AssertionConfig[] = [
      { id: '1', type: 'jsonPath', target: '$.data.username', operator: 'eq', expected: 'john_doe' },
      { id: '2', type: 'jsonPath', target: '$.data.score', operator: 'gt', expected: 90 },
      { id: '3', type: 'jsonPath', target: '$.data.isActive', operator: 'eq', expected: true },
      { id: '4', type: 'jsonPath', target: '$.data.tags', operator: 'contains', expected: 'flow' },
    ];

    const results = evaluateAssertions(assertions, mockResponse);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('evaluates exists assertions', () => {
    const assertions: AssertionConfig[] = [
      { id: '1', type: 'exists', target: '$.data.id' },
      { id: '2', type: 'exists', target: '$.data.missingField' },
    ];

    const results = evaluateAssertions(assertions, mockResponse);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it('evaluates typeCheck assertions', () => {
    const assertions: AssertionConfig[] = [
      { id: '1', type: 'typeCheck', target: '$.data.id', expected: 'number' },
      { id: '2', type: 'typeCheck', target: '$.data.username', expected: 'string' },
      { id: '3', type: 'typeCheck', target: '$.data.isActive', expected: 'boolean' },
      { id: '4', type: 'typeCheck', target: '$.data.tags', expected: 'array' },
    ];

    const results = evaluateAssertions(assertions, mockResponse);
    expect(results.every(r => r.passed)).toBe(true);
  });

  it('evaluates responseTime assertions', () => {
    const assertions: AssertionConfig[] = [
      { id: '1', type: 'responseTime', expected: 200 },
      { id: '2', type: 'responseTime', expected: 50 },
    ];

    const results = evaluateAssertions(assertions, mockResponse);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });
});
