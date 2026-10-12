import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME, TokenPayload } from '../utils/auth';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // 1. Try HttpOnly Cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. Try Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required to access this resource',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired session. Please log in again.',
    });
    return;
  }

  // Check if user is still active in database
  const user = await User.findById(payload.userId).lean();
  if (!user || user.status === 'disabled') {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Account not found or has been disabled',
    });
    return;
  }

  req.user = payload;
  next();
}
