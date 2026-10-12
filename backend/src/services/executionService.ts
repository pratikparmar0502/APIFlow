import { Execution, IExecution } from '../models/Execution';

export interface ExecutionListOptions {
  userId: string;
  workflowId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listExecutions(options: ExecutionListOptions): Promise<{
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
  query.userId = options.userId;
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

export async function getExecutionById(id: string, userId: string): Promise<IExecution | null> {
  return Execution.findOne({ _id: id, userId });
}

export async function deleteExecution(id: string, userId: string): Promise<boolean> {
  const result = await Execution.findOneAndDelete({ _id: id, userId });
  return result !== null;
}
