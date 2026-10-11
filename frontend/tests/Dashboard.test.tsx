import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../src/pages/Dashboard';

// Mock API calls
vi.mock('../src/api/workflows', () => ({
  getWorkflows: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  createWorkflow: vi.fn(),
}));

vi.mock('../src/api/executions', () => ({
  getExecutions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
  },
}));

describe('Dashboard Component', () => {
  it('renders dashboard headline and action buttons', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Visual API Automation Platform/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Total Workflows/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Workflow/i)).toBeInTheDocument();
    });
  });
});
