import { useState, useEffect, useCallback } from 'react';
import { Workflow, PaginatedResponse } from '../types';
import { getWorkflows, deleteWorkflow, duplicateWorkflow, createWorkflow, GetWorkflowsParams } from '../api/workflows';
import toast from 'react-hot-toast';

export const useWorkflows = (initialParams?: GetWorkflowsParams) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<Workflow>, 'items'>>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async (params?: GetWorkflowsParams) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkflows(params);
      setWorkflows(res.items || []);
      setPagination({
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 10,
        totalPages: res.totalPages || 1,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch workflows';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows(initialParams);
  }, [fetchWorkflows, initialParams]);

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => (w._id || w.id) !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success('Workflow deleted');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workflow';
      toast.error(msg);
      return false;
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await duplicateWorkflow(id);
      setWorkflows((prev) => [dup, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      toast.success('Workflow duplicated');
      return dup;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to duplicate workflow';
      toast.error(msg);
      return null;
    }
  };

  const handleCreate = async (data: Omit<Workflow, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await createWorkflow(data);
      setWorkflows((prev) => [created, ...prev]);
      toast.success('Workflow created');
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workflow';
      toast.error(msg);
      return null;
    }
  };

  return {
    workflows,
    pagination,
    loading,
    error,
    refresh: fetchWorkflows,
    deleteWorkflow: handleDelete,
    duplicateWorkflow: handleDuplicate,
    createWorkflow: handleCreate,
  };
};
