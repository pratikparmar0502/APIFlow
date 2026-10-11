import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowList } from '../src/pages/WorkflowList';

// Mock API calls
vi.mock('../src/api/workflows', () => ({
  getWorkflows: vi.fn().mockResolvedValue({
    items: [
      {
        _id: 'wf-1',
        name: 'Test Workflow 1',
        description: 'First test description',
        nodes: [],
        edges: [],
        settings: { continueOnFailure: false, maxExecutionTimeMs: 1000 },
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  }),
  deleteWorkflow: vi.fn(),
  duplicateWorkflow: vi.fn(),
}));

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
  },
}));

describe('WorkflowList Component', () => {
  it('renders workflow search bar, workflow name, and workflow description', async () => {
    render(
      <BrowserRouter>
        <WorkflowList />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Search workflows.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
      expect(screen.getByText('First test description')).toBeInTheDocument();
    });
  });
});
