import apiClient from './client';
import { ExecuteRequestInput, ExecuteRequestResult } from '../types';

export const executeRequest = async (
  input: ExecuteRequestInput
): Promise<ExecuteRequestResult> => {
  const response = await apiClient.post<{ data?: ExecuteRequestResult } | ExecuteRequestResult>(
    '/requests/execute',
    input
  );
  const data = response.data;
  if ('data' in data && data.data) {
    return data.data;
  }
  return data as ExecuteRequestResult;
};
