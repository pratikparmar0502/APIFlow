import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from '../services/workflowService';
import { executeWorkflow } from '../services/workflowEngine';
import { executionRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import { requireCsrfProtection } from '../middleware/csrf';

const router = Router();
router.use(requireAuth, requireCsrfProtection);

const QueryParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});

const HeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});

const AssertionConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['status', 'jsonPath', 'exists', 'typeCheck', 'responseTime']),
  target: z.string().optional(),
  operator: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains', 'exists']).optional(),
  expected: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional(),
});

const ExtractionRuleSchema = z.object({
  id: z.string(),
  variableName: z.string(),
  source: z.enum(['responseJson', 'responseHeader', 'responseStatus']),
  jsonPath: z.string().optional(),
  headerName: z.string().optional(),
});

const RequestConfigSchema = z.object({
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
  queryParams: z.array(QueryParamSchema).default([]),
  headers: z.array(HeaderSchema).default([]),
  body: z.string().optional(),
  timeoutMs: z.number().min(100).max(60000).optional(),
  assertions: z.array(AssertionConfigSchema).default([]),
  extractionRules: z.array(ExtractionRuleSchema).default([]),
});

const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.literal('request'),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: RequestConfigSchema,
});

const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

const WorkflowSettingsSchema = z.object({
  continueOnFailure: z.boolean().default(false),
  maxExecutionTimeMs: z.number().default(120000),
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  nodes: z.array(WorkflowNodeSchema).optional(),
  edges: z.array(WorkflowEdgeSchema).optional(),
  settings: WorkflowSettingsSchema.optional(),
});

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  nodes: z.array(WorkflowNodeSchema).optional(),
  edges: z.array(WorkflowEdgeSchema).optional(),
  settings: WorkflowSettingsSchema.optional(),
});

const ExecuteWorkflowSchema = z.object({
  variables: z.record(z.unknown()).optional(),
});

// GET /api/v1/workflows
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user!.userId;
    const result = await listWorkflows({
      userId,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/workflows
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateWorkflowSchema.parse(req.body);
    const userId = req.user!.userId;
    const workflow = await createWorkflow({ ...validated, userId });
    res.status(201).json(workflow);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/workflows/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const workflow = await getWorkflowById(req.params.id, userId);
    if (!workflow) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Workflow not found' });
      return;
    }
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/workflows/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateWorkflowSchema.parse(req.body);
    const userId = req.user!.userId;
    const updated = await updateWorkflow(req.params.id, validated, userId);
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Workflow not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/workflows/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const deleted = await deleteWorkflow(req.params.id, userId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Workflow not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/workflows/:id/duplicate
router.post('/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const duplicate = await duplicateWorkflow(req.params.id, userId);
    if (!duplicate) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Workflow not found' });
      return;
    }
    res.status(201).json(duplicate);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/workflows/:id/execute
router.post('/:id/execute', executionRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ExecuteWorkflowSchema.parse(req.body || {});
    const userId = req.user!.userId;
    const executionId = await executeWorkflow(req.params.id, validated.variables, userId);
    res.status(202).json({
      executionId,
      message: 'Workflow execution completed',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
