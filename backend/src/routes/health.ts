import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
    },
  });
});

export default router;
