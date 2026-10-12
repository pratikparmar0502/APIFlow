import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; code?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    const customErr = new Error(message) as Error & { status?: number; code?: string };
    customErr.status = error.response?.status;
    customErr.code = error.response?.data?.code;
    return Promise.reject(customErr);
  }
);

export default apiClient;
