import apiClient from './client';
import { Execution, PaginatedResponse } from '../types';

export interface GetExecutionsParams {
  page?: number;
  limit?: number;
  workflowId?: string;
  status?: string;
}

export const getExecutions = async (
  params?: GetExecutionsParams
): Promise<PaginatedResponse<Execution>> => {
  const response = await apiClient.get<PaginatedResponse<Execution> | { data: PaginatedResponse<Execution> | Execution[] } | Execution[]>('/executions', { params });
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

  if ('executions' in raw && Array.isArray((raw as { executions: Execution[] }).executions)) {
    const r = raw as { executions: Execution[]; total: number; page: number; limit: number; totalPages: number };
    return {
      items: r.executions,
      total: r.total || r.executions.length,
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
        return inner as PaginatedResponse<Execution>;
      }
      if ('executions' in inner && Array.isArray((inner as { executions: Execution[] }).executions)) {
        const inE = inner as { executions: Execution[]; total: number; page: number; limit: number; totalPages: number };
        return {
          items: inE.executions,
          total: inE.total || inE.executions.length,
          page: inE.page || 1,
          limit: inE.limit || 10,
          totalPages: inE.totalPages || 1,
        };
      }
    }
  }

  return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
};

export const getExecution = async (id: string): Promise<Execution> => {
  const response = await apiClient.get<{ data?: Execution } | Execution>(`/executions/${id}`);
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as Execution;
};

export const deleteExecution = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/executions/${id}`);
  return response.data;
};
