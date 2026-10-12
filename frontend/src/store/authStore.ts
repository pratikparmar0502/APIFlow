import { create } from 'zustand';
import { User, getCurrentUser, login as apiLogin, signup as apiSignup, logout as apiLogout, LoginPayload, SignupPayload } from '../api/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiLogin(payload);
      set({ user: res.user, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  signup: async (payload: SignupPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiSignup(payload);
      set({ user: res.user, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Signup failed' });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
    } catch {
      // Even if network fails, clear local state
    } finally {
      set({ user: null, isLoading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
