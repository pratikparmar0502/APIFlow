import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { corsMiddleware } from './middleware/cors';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import workflowsRoutes from './routes/workflows';
import executionsRoutes from './routes/executions';
import requestsRoutes from './routes/requests';

export function createApp(): express.Application {
  const app = express();

  // Basic security headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // Request ID middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = uuidv4();
    }
    next();
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global rate limiter for API routes
  app.use('/api/v1', apiRateLimiter);

  // Mount API routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/workflows', workflowsRoutes);
  app.use('/api/v1/executions', executionsRoutes);
  app.use('/api/v1/requests', requestsRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
