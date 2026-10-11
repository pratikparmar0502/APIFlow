import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from '../ui/Badge';
import { RequestConfig, HttpMethod } from '../../types';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

export interface RequestNodeData {
  label: string;
  config: RequestConfig;
  status?: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
}

const RequestNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as RequestNodeData;
  const { label, config, status = 'pending' } = nodeData;

  const getStatusIcon = () => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-failure" />;
      case 'running':
        return <Loader2 className="w-3.5 h-3.5 text-yellow animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-text-secondary/60" />;
    }
  };

  return (
    <div
      className={`relative min-w-[220px] max-w-[280px] bg-panel border rounded-xl shadow-lg transition-all duration-150 p-3 ${
        selected
          ? 'border-yellow ring-2 ring-yellow/30 shadow-yellow/5'
          : 'border-border hover:border-text-secondary/40'
      }`}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-yellow !border-2 !border-panel"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-yellow !border-2 !border-panel"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge method={(config?.method || 'GET') as HttpMethod} size="sm" />
        <div className="flex items-center gap-1.5">{getStatusIcon()}</div>
      </div>

      {/* Title */}
      <div className="font-semibold text-xs text-text-primary truncate mb-1" title={label}>
        {label || 'Request Step'}
      </div>

      {/* URL preview */}
      <div
        className="font-mono text-[11px] text-text-secondary bg-secondary-bg px-2 py-1 rounded border border-border/50 truncate"
        title={config?.url}
      >
        {config?.url || 'https://...'}
      </div>

      {/* Quick counts */}
      <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-2 border-t border-border/40">
        <span>Asserts: {config?.assertions?.length || 0}</span>
        <span>Extracts: {config?.extractionRules?.length || 0}</span>
      </div>
    </div>
  );
};

export const RequestNode = memo(RequestNodeComponent);
