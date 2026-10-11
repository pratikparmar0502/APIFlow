import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      requestId,
    } satisfies ApiError);
    return;
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number; statusCode?: number }).status ||
                   (err as Error & { status?: number; statusCode?: number }).statusCode || 500;
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(status).json({
      code: (err as Error & { code?: string }).code || 'INTERNAL_ERROR',
      message: err.message,
      // Never expose stack traces in production
      ...(isDev ? { stack: err.stack } : {}),
      requestId,
    } satisfies ApiError);
    return;
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  } satisfies ApiError);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: uuidv4(),
  });
}
