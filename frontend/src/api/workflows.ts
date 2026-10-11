import apiClient from './client';
import { Workflow, PaginatedResponse, Execution } from '../types';
import { getExecution } from './executions';

export interface GetWorkflowsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getWorkflows = async (
  params?: GetWorkflowsParams
): Promise<PaginatedResponse<Workflow>> => {
  const response = await apiClient.get<PaginatedResponse<Workflow> | { data: PaginatedResponse<Workflow> | Workflow[] } | Workflow[]>('/workflows', { params });
  const raw = response.data;
  
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
      page: 1,
      limit: raw.length || 10,
      totalPages: 1,
    };
  }
  
  if ('items' in raw && Array.isArray(raw.items)) {
    return raw;
  }

  if ('workflows' in raw && Array.isArray((raw as { workflows: Workflow[] }).workflows)) {
    const r = raw as { workflows: Workflow[]; total: number; page: number; limit: number; totalPages: number };
    return {
      items: r.workflows,
      total: r.total || r.workflows.length,
      page: r.page || 1,
      limit: r.limit || 10,
      totalPages: r.totalPages || 1,
    };
  }

  if ('data' in raw) {
    const inner = raw.data;
    if (Array.isArray(inner)) {
      return {
        items: inner,
        total: inner.length,
        page: 1,
        limit: inner.length || 10,
        totalPages: 1,
      };
    }
    if (inner && typeof inner === 'object') {
      if ('items' in inner && Array.isArray(inner.items)) {
        return inner as PaginatedResponse<Workflow>;
      }
      if ('workflows' in inner && Array.isArray((inner as { workflows: Workflow[] }).workflows)) {
        const inW = inner as { workflows: Workflow[]; total: number; page: number; limit: number; totalPages: number };
        return {
          items: inW.workflows,
          total: inW.total || inW.workflows.length,
          page: inW.page || 1,
          limit: inW.limit || 10,
          totalPages: inW.totalPages || 1,
        };
      }
    }
  }

  return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
};

export const getWorkflow = async (id: string): Promise<Workflow> => {
  const response = await apiClient.get<{ data?: Workflow } | Workflow>(`/workflows/${id}`);
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Workflow;
};

export const createWorkflow = async (
  workflow: Omit<Workflow, '_id' | 'id' | 'createdAt' | 'updatedAt'>
): Promise<Workflow> => {
  const response = await apiClient.post<{ data?: Workflow } | Workflow>('/workflows', workflow);
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Workflow;
};

export const updateWorkflow = async (
  id: string,
  workflow: Partial<Workflow>
): Promise<Workflow> => {
  const response = await apiClient.put<{ data?: Workflow } | Workflow>(`/workflows/${id}`, workflow);
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Workflow;
};

export const deleteWorkflow = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/workflows/${id}`);
  return response.data;
};

export const duplicateWorkflow = async (id: string): Promise<Workflow> => {
  const response = await apiClient.post<{ data?: Workflow } | Workflow>(`/workflows/${id}/duplicate`);
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Workflow;
};

export const executeWorkflow = async (
  id: string,
  variables?: Record<string, unknown>
): Promise<Execution> => {
  const response = await apiClient.post<{ executionId?: string; data?: Execution } | Execution>(
    `/workflows/${id}/execute`,
    { variables }
  );
  const data = response.data;
  if ('executionId' in data && data.executionId) {
    return getExecution(data.executionId);
  }
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Execution;
};
