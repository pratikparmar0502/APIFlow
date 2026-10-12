import { Workflow, IWorkflow } from '../models/Workflow';
import { Execution } from '../models/Execution';
import { validateWorkflowGraph } from '../utils/graphValidator';
import { config } from '../config/env';

export interface WorkflowListOptions {
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listWorkflows(options: WorkflowListOptions = {}): Promise<{
  workflows: IWorkflow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (options.userId) {
    // Backward compatibility: match either the user's workflows or legacy unowned workflows
    query.$or = [{ userId: options.userId }, { userId: { $exists: false } }, { userId: null }];
  }
  if (options.search && options.search.trim()) {
    query.name = { $regex: options.search.trim(), $options: 'i' };
  }

  const sortField = options.sortBy || 'createdAt';
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortDirection as 1 | -1 };

  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Workflow.countDocuments(query),
  ]);

  return {
    workflows: workflows as unknown as IWorkflow[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getWorkflowById(id: string, userId?: string): Promise<IWorkflow | null> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  return Workflow.findOne(query);
}

export async function createWorkflow(data: {
  userId?: string;
  name: string;
  description?: string;
  nodes?: IWorkflow['nodes'];
  edges?: IWorkflow['edges'];
  settings?: IWorkflow['settings'];
}): Promise<IWorkflow> {
  const nodes = data.nodes || [];
  const edges = data.edges || [];

  if (nodes.length > config.maxWorkflowNodes) {
    throw new Error(`Workflow exceeds maximum of ${config.maxWorkflowNodes} nodes`);
  }

  if (nodes.length > 0) {
    const validation = validateWorkflowGraph(nodes, edges);
    if (!validation.valid) {
      throw new Error(`Invalid workflow graph: ${validation.errors.join('; ')}`);
    }
  }

  const workflow = new Workflow({
    userId: data.userId,
    name: data.name,
    description: data.description || '',
    nodes,
    edges,
    settings: data.settings || { continueOnFailure: false, maxExecutionTimeMs: 120000 },
  });

  return workflow.save();
}

export async function updateWorkflow(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    nodes: IWorkflow['nodes'];
    edges: IWorkflow['edges'];
    settings: IWorkflow['settings'];
  }>,
  userId?: string
): Promise<IWorkflow | null> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  const existing = await Workflow.findOne(query);
  if (!existing) {
    return null;
  }

  const nodes = data.nodes !== undefined ? data.nodes : existing.nodes;
  const edges = data.edges !== undefined ? data.edges : existing.edges;

  if (nodes.length > config.maxWorkflowNodes) {
    throw new Error(`Workflow exceeds maximum of ${config.maxWorkflowNodes} nodes`);
  }

  if (nodes.length > 0) {
    const validation = validateWorkflowGraph(nodes, edges);
    if (!validation.valid) {
      throw new Error(`Invalid workflow graph: ${validation.errors.join('; ')}`);
    }
  }

  if (data.name !== undefined) existing.name = data.name;
  if (data.description !== undefined) existing.description = data.description;
  if (data.nodes !== undefined) existing.nodes = data.nodes;
  if (data.edges !== undefined) existing.edges = data.edges;
  if (data.settings !== undefined) existing.settings = data.settings;
  if (!existing.userId && userId) existing.userId = userId as any;

  return existing.save();
}

export async function deleteWorkflow(id: string, userId?: string): Promise<boolean> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  const deleted = await Workflow.findOneAndDelete(query);
  if (!deleted) return false;
  // Also clean up executions associated with this workflow
  await Execution.deleteMany({ workflowId: id });
  return true;
}

export async function duplicateWorkflow(id: string, userId?: string): Promise<IWorkflow | null> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  const original = await Workflow.findOne(query).lean();
  if (!original) return null;

  const duplicate = new Workflow({
    userId: userId || original.userId,
    name: `${original.name} (Copy)`,
    description: original.description,
    nodes: original.nodes,
    edges: original.edges,
    settings: original.settings,
  });

  return duplicate.save();
}
