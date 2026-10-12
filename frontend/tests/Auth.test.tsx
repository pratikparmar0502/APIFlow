import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../src/pages/Login';
import { Signup } from '../src/pages/Signup';
import * as authApi from '../src/api/auth';
import { useAuthStore } from '../src/store/authStore';

vi.mock('../src/api/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Auth Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  describe('Login Component', () => {
    it('renders login form with email, password fields and sign in button', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('developer@apiflow.io')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits login data when form is filled and submitted', async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce({
        user: { id: 'usr-123', email: 'dev@test.io', name: 'Dev User' },
        token: 'fake-token',
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('developer@apiflow.io'), {
        target: { value: 'dev@test.io' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
        target: { value: 'secretPassword123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'dev@test.io',
          password: 'secretPassword123',
        });
      });
    });
  });

  describe('Signup Component', () => {
    it('renders signup form with name, email, password and confirmation fields', () => {
      render(
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('developer@apiflow.io')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('displays client-side error if passwords do not match', async () => {
      render(
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('developer@apiflow.io'), {
        target: { value: 'dev@test.io' },
      });
      fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
        target: { value: 'differentpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(authApi.signup).not.toHaveBeenCalled();
    });
  });
});
