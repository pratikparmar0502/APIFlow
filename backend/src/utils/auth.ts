import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config/env';
import { IUser } from '../models/User';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';
export const AUTH_COOKIE_NAME = 'apiflow_session';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { _id?: any; id?: any; userId?: string; email: string; name?: string }): string {
  const userId = (user.userId ? user.userId.toString() : user._id ? user._id.toString() : user.id ? user.id.toString() : '') || '';
  const payload: TokenPayload = {
    userId,
    email: user.email,
    name: user.name || '',
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}

export function sanitizeUser(user: IUser): { id: string; email: string; name: string; createdAt: Date } {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
