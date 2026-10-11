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
  if (!path.startsWith('$')) {
    return { value: undefined, found: false };
  }

  // Implement a safe, limited subset of JSONPath
  // Supports: $.key, $.key.nested, $.key[0], $.key[0].nested
  try {
    const segments = parseJsonPath(path);
    let current: unknown = data;
    
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return { value: undefined, found: false };
      }
      if (segment.type === 'key') {
        if (typeof current !== 'object' || Array.isArray(current)) {
          return { value: undefined, found: false };
        }
        const obj = current as Record<string, unknown>;
        if (!(segment.value in obj)) {
          return { value: undefined, found: false };
        }
        current = obj[segment.value as string];
      } else if (segment.type === 'index') {
        if (!Array.isArray(current)) {
          return { value: undefined, found: false };
        }
        const idx = segment.value as number;
        if (idx < 0 || idx >= current.length) {
          return { value: undefined, found: false };
        }
        current = current[idx];
      }
    }
    
    return { value: current, found: true };
  } catch {
    return { value: undefined, found: false };
  }
}

type PathSegment = { type: 'key'; value: string } | { type: 'index'; value: number };

function parseJsonPath(path: string): PathSegment[] {
  // Remove leading $
  if (!path.startsWith('$')) throw new Error('Path must start with $');
  
  const segments: PathSegment[] = [];
  let rest = path.slice(1);
  
  while (rest.length > 0) {
    if (rest.startsWith('.')) {
      rest = rest.slice(1);
      // Read key
      const match = rest.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (!match) throw new Error(`Invalid path segment: ${rest}`);
      segments.push({ type: 'key', value: match[1] });
      rest = rest.slice(match[1].length);
    } else if (rest.startsWith('[')) {
      const end = rest.indexOf(']');
      if (end === -1) throw new Error('Unclosed bracket in path');
      const idx = parseInt(rest.slice(1, end), 10);
      if (isNaN(idx)) throw new Error(`Invalid array index: ${rest.slice(1, end)}`);
      segments.push({ type: 'index', value: idx });
      rest = rest.slice(end + 1);
    } else {
      throw new Error(`Unexpected character in path: ${rest[0]}`);
    }
  }
  
  return segments;
}

export function validateVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
