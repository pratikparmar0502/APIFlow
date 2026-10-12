import { Execution, IExecution } from '../models/Execution';

export interface ExecutionListOptions {
  userId?: string;
  workflowId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listExecutions(options: ExecutionListOptions = {}): Promise<{
  executions: IExecution[];
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
    query.$or = [{ userId: options.userId }, { userId: { $exists: false } }, { userId: null }];
  }
  if (options.workflowId) {
    query.workflowId = options.workflowId;
  }
  if (options.status) {
    query.status = options.status;
  }

  const [executions, total] = await Promise.all([
    Execution.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Execution.countDocuments(query),
  ]);

  return {
    executions: executions as unknown as IExecution[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getExecutionById(id: string, userId?: string): Promise<IExecution | null> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  return Execution.findOne(query);
}

export async function deleteExecution(id: string, userId?: string): Promise<boolean> {
  const query: Record<string, unknown> = { _id: id };
  if (userId) {
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  const result = await Execution.findOneAndDelete(query);
  return result !== null;
}
