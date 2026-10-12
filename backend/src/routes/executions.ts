import { Router, Request, Response, NextFunction } from 'express';
import { listExecutions, getExecutionById, deleteExecution } from '../services/executionService';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/v1/executions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, status, page, limit } = req.query;
    const userId = req.user?.userId;
    const result = await listExecutions({
      userId,
      workflowId: typeof workflowId === 'string' ? workflowId : undefined,
      status: typeof status === 'string' ? status : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/executions/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const execution = await getExecutionById(req.params.id, userId);
    if (!execution) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Execution not found' });
      return;
    }
    res.json(execution);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/executions/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const deleted = await deleteExecution(req.params.id, userId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Execution not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

