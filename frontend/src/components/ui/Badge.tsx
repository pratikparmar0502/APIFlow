import React from 'react';
import { HttpMethod } from '../../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'method' | 'status' | 'outline';
  method?: HttpMethod;
  color?: 'yellow' | 'green' | 'red' | 'blue' | 'gray' | 'purple' | 'orange';
  className?: string;
  size?: 'sm' | 'md';
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  HEAD: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  method,
  color = 'gray',
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  if (method) {
    return (
      <span
        className={`inline-flex items-center font-mono font-semibold rounded border uppercase tracking-wider ${methodColors[method]} ${sizeClass} ${className}`}
      >
        {method}
      </span>
    );
  }

  const colorClasses = {
    yellow: 'bg-yellow/15 text-yellow border-yellow/30',
    green: 'bg-success/20 text-success border-success/30',
    red: 'bg-failure/20 text-failure border-failure/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gray: 'bg-panel text-text-secondary border-border',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    orange: 'bg-warning/20 text-warning border-warning/30',
  }[color];

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${colorClasses} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
};
