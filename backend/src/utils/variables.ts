import { JSONPath } from 'jsonpath-plus';

const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
const MAX_JSON_PATH_LENGTH = 1024;
// Deliberately allow only property and array-index selection. JSONPath filters,
// script expressions and recursive descent are not needed by APIFlow extraction.
const SAFE_JSON_PATH = /^\$(?:\.[A-Za-z_$][A-Za-z0-9_$]*|\[(?:\d+|"[^"\\]*"|'[^'\\]*')\])*$/;

export function interpolateVariables(
  template: string,
  context: Record<string, unknown>
): { result: string; missingVars: string[] } {
  const missingVars: string[] = [];
  const result = template.replace(VARIABLE_PATTERN, (match, varName: string) => {
    if (varName in context) {
      const val = context[varName];
      if (val === null || val === undefined) {
        missingVars.push(varName);
        return match; // keep placeholder
      }
      return String(val);
    }
    missingVars.push(varName);
    return match; // keep placeholder so caller can detect it
  });
  return { result, missingVars };
}

export function extractJsonPath(
  data: unknown,
  path: string
): { value: unknown; found: boolean } {
  if (!path || typeof path !== 'string' || path.length > MAX_JSON_PATH_LENGTH || !SAFE_JSON_PATH.test(path)) {
    return { value: undefined, found: false };
  }

  if (data === null || data === undefined) {
    return { value: undefined, found: false };
  }

  try {
    const results = JSONPath({
      path,
      json: data as object,
      wrap: true,
      // Expressions and filters can execute evaluator code in JSONPath implementations.
      // APIFlow supports property/index JSONPath selection only.
      eval: false,
    });

    if (!Array.isArray(results) || results.length === 0) {
      return { value: undefined, found: false };
    }

    return { value: results[0], found: true };
  } catch {
    return { value: undefined, found: false };
  }
}

export function validateVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
