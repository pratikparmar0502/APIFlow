import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken, sanitizeUser } from '../src/utils/auth';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('hashes passwords securely and generates valid salt', async () => {
      const password = 'SuperSecret123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('correctly verifies a matching password', async () => {
      const password = 'ValidPassword89!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const password = 'ValidPassword89!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation and Verification', () => {
    it('generates a valid JWT and decodes the payload', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };
      const token = generateToken(payload);
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it('returns null for an invalid or tampered token', () => {
      const result = verifyToken('invalid.token.structure');
      expect(result).toBeNull();
    });
  });

  describe('sanitizeUser', () => {
    it('strips passwordHash and returns public user representation', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'secret_hash_value',
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const sanitized = sanitizeUser(mockUser as any);
      expect(sanitized.id).toBe('507f1f77bcf86cd799439011');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.name).toBe('Test User');
      expect((sanitized as any).passwordHash).toBeUndefined();
    });
  });
});
