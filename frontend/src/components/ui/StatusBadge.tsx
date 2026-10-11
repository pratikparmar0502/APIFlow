import React from 'react';
import { StepStatus, WorkflowStatus } from '../../types';

export interface StatusBadgeProps {
  status: StepStatus | WorkflowStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let config = {
    bg: 'bg-panel',
    text: 'text-text-secondary',
    border: 'border-border',
    dot: 'bg-text-secondary',
    label: status,
  };

  switch (normalized) {
    case 'passed':
    case 'success':
      config = {
        bg: 'bg-success/10',
        text: 'text-success',
        border: 'border-success/30',
        dot: 'bg-success',
        label: 'Passed',
      };
      break;
    case 'failed':
    case 'error':
      config = {
        bg: 'bg-failure/10',
        text: 'text-failure',
        border: 'border-failure/30',
        dot: 'bg-failure',
        label: 'Failed',
      };
      break;
    case 'running':
      config = {
        bg: 'bg-yellow/10',
        text: 'text-yellow',
        border: 'border-yellow/30',
        dot: 'bg-yellow animate-pulse',
        label: 'Running',
      };
      break;
    case 'pending':
      config = {
        bg: 'bg-panel',
        text: 'text-text-secondary',
        border: 'border-border',
        dot: 'bg-text-secondary/60',
        label: 'Pending',
      };
      break;
    case 'skipped':
    case 'cancelled':
      config = {
        bg: 'bg-panel',
        text: 'text-text-secondary',
        border: 'border-border',
        dot: 'bg-warning',
        label: normalized === 'skipped' ? 'Skipped' : 'Cancelled',
      };
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
};
