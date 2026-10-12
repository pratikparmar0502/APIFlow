import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name?: string;
  status?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/signup', payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function logout(): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/logout');
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.data.user;
}
