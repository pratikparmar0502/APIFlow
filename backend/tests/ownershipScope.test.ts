import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  workflowFindOne: vi.fn(),
  workflowFindOneAndDelete: vi.fn(),
  workflowFind: vi.fn(),
  workflowCountDocuments: vi.fn(),
  executionFindOne: vi.fn(),
  executionFindOneAndDelete: vi.fn(),
  executionFind: vi.fn(),
  executionCountDocuments: vi.fn(),
  executionDeleteMany: vi.fn(),
}));

vi.mock('../src/models/Workflow', () => ({
  Workflow: {
    findOne: mocks.workflowFindOne,
    findOneAndDelete: mocks.workflowFindOneAndDelete,
    find: mocks.workflowFind,
    countDocuments: mocks.workflowCountDocuments,
  },
}));
vi.mock('../src/models/Execution', () => ({
  Execution: {
    findOne: mocks.executionFindOne,
    findOneAndDelete: mocks.executionFindOneAndDelete,
    find: mocks.executionFind,
    countDocuments: mocks.executionCountDocuments,
    deleteMany: mocks.executionDeleteMany,
  },
}));

import { deleteWorkflow, getWorkflowById, listWorkflows } from '../src/services/workflowService';
import { deleteExecution, getExecutionById, listExecutions } from '../src/services/executionService';

const chain = (value: unknown) => ({ sort: () => chain(value), skip: () => chain(value), limit: () => chain(value), lean: async () => value });

describe('ownership query scopes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.workflowFind.mockReturnValue(chain([]));
    mocks.executionFind.mockReturnValue(chain([]));
    mocks.workflowCountDocuments.mockResolvedValue(0);
    mocks.executionCountDocuments.mockResolvedValue(0);
  });

  it('does not expose User B or ownerless workflows to User A', async () => {
    mocks.workflowFindOne.mockResolvedValue(null);
    mocks.workflowFindOneAndDelete.mockResolvedValue(null);
    await expect(getWorkflowById('workflow-b', 'user-a')).resolves.toBeNull();
    await expect(deleteWorkflow('workflow-b', 'user-a')).resolves.toBe(false);
    await listWorkflows({ userId: 'user-a' });
    expect(mocks.workflowFindOne).toHaveBeenCalledWith({ _id: 'workflow-b', userId: 'user-a' });
    expect(mocks.workflowFindOneAndDelete).toHaveBeenCalledWith({ _id: 'workflow-b', userId: 'user-a' });
    expect(mocks.workflowFind).toHaveBeenCalledWith({ userId: 'user-a' });
  });

  it('does not expose User B or ownerless execution history to User A', async () => {
    mocks.executionFindOne.mockResolvedValue(null);
    mocks.executionFindOneAndDelete.mockResolvedValue(null);
    await expect(getExecutionById('execution-b', 'user-a')).resolves.toBeNull();
    await expect(deleteExecution('execution-b', 'user-a')).resolves.toBe(false);
    await listExecutions({ userId: 'user-a' });
    expect(mocks.executionFindOne).toHaveBeenCalledWith({ _id: 'execution-b', userId: 'user-a' });
    expect(mocks.executionFindOneAndDelete).toHaveBeenCalledWith({ _id: 'execution-b', userId: 'user-a' });
    expect(mocks.executionFind).toHaveBeenCalledWith({ userId: 'user-a' });
  });
});
