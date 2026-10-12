import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../utils/auth';
import { isAllowedBrowserOrigin } from './cors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie-authenticated browser requests must originate from an approved UI.
 * Bearer-token clients remain supported without an Origin header.
 */
export function requireCsrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin || !isAllowedBrowserOrigin(origin)) {
    res.status(403).json({
      code: 'CSRF_ORIGIN_REJECTED',
      message: 'Request origin is not permitted',
    });
    return;
  }

  next();
}
