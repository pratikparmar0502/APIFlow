import { Execution, IExecution } from '../models/Execution';

export interface ExecutionListOptions {
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

export async function getExecutionById(id: string): Promise<IExecution | null> {
  return Execution.findById(id);
}

export async function deleteExecution(id: string): Promise<boolean> {
  const result = await Execution.findByIdAndDelete(id);
  return result !== null;
}
