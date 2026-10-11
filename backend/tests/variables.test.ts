import { describe, it, expect } from 'vitest';
import { interpolateVariables, extractJsonPath, validateVariableName } from '../src/utils/variables';

describe('Variable Interpolation & Extraction', () => {
  describe('interpolateVariables', () => {
    it('interpolates single and multiple variables correctly', () => {
      const template = 'https://api.example.com/users/{{userId}}/posts/{{postId}}';
      const context = { userId: '123', postId: '456' };
      const { result, missingVars } = interpolateVariables(template, context);
      expect(result).toBe('https://api.example.com/users/123/posts/456');
      expect(missingVars).toHaveLength(0);
    });

    it('identifies missing variables and keeps placeholder', () => {
      const template = 'Bearer {{token}} for {{username}}';
      const context = { username: 'alice' };
      const { result, missingVars } = interpolateVariables(template, context);
      expect(result).toBe('Bearer {{token}} for alice');
      expect(missingVars).toEqual(['token']);
    });

    it('handles numeric and boolean variable values', () => {
      const template = 'limit={{limit}}&active={{active}}';
      const context = { limit: 50, active: true };
      const { result, missingVars } = interpolateVariables(template, context);
      expect(result).toBe('limit=50&active=true');
      expect(missingVars).toHaveLength(0);
    });

    it('correctly interpolates 0, false, and empty string without marking them as missing', () => {
      const template = 'count={{zero}}&enabled={{flag}}&prefix={{empty}}';
      const context = { zero: 0, flag: false, empty: '' };
      const { result, missingVars } = interpolateVariables(template, context);
      expect(result).toBe('count=0&enabled=false&prefix=');
      expect(missingVars).toHaveLength(0);
    });
  });

  describe('extractJsonPath', () => {
    const payload = {
      user: {
        id: 42,
        name: 'Alice',
        roles: ['admin', 'editor'],
        profile: {
          email: 'alice@example.com',
        },
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    };

    it('extracts top-level and nested object properties', () => {
      expect(extractJsonPath(payload, '$.user.id')).toEqual({ value: 42, found: true });
      expect(extractJsonPath(payload, '$.user.profile.email')).toEqual({
        value: 'alice@example.com',
        found: true,
      });
    });

    it('extracts array elements and nested fields inside arrays', () => {
      expect(extractJsonPath(payload, '$.user.roles[0]')).toEqual({ value: 'admin', found: true });
      expect(extractJsonPath(payload, '$.items[1].name')).toEqual({ value: 'Item 2', found: true });
    });

    it('returns found: false for non-existent paths', () => {
      expect(extractJsonPath(payload, '$.user.nonexistent')).toEqual({ value: undefined, found: false });
      expect(extractJsonPath(payload, '$.items[99]')).toEqual({ value: undefined, found: false });
      expect(extractJsonPath(payload, 'invalid_path')).toEqual({ value: undefined, found: false });
    });

    it('handles null, zero, false, empty string, and keys with hyphens correctly', () => {
      const specialPayload = {
        'api-key': 'secret_123',
        nullVal: null,
        zeroVal: 0,
        falseVal: false,
        emptyStr: '',
      };

      expect(extractJsonPath(specialPayload, '$["api-key"]')).toEqual({ value: 'secret_123', found: true });
      expect(extractJsonPath(specialPayload, '$.nullVal')).toEqual({ value: null, found: true });
      expect(extractJsonPath(specialPayload, '$.zeroVal')).toEqual({ value: 0, found: true });
      expect(extractJsonPath(specialPayload, '$.falseVal')).toEqual({ value: false, found: true });
      expect(extractJsonPath(specialPayload, '$.emptyStr')).toEqual({ value: '', found: true });
    });
  });

  describe('validateVariableName', () => {
    it('validates variable naming rules', () => {
      expect(validateVariableName('userId')).toBe(true);
      expect(validateVariableName('_temp_var_1')).toBe(true);
      expect(validateVariableName('123invalid')).toBe(false);
      expect(validateVariableName('var-name')).toBe(false);
      expect(validateVariableName('var name')).toBe(false);
    });
  });
});
