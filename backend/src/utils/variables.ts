import { JSONPath } from 'jsonpath-plus';

const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

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
  if (!path || typeof path !== 'string' || !path.startsWith('$')) {
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
