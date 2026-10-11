import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  let formatted = '';
  try {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        formatted = JSON.stringify(parsed, null, 2);
      } catch {
        formatted = data;
      }
    } else {
      formatted = JSON.stringify(data, null, 2);
    }
  } catch {
    formatted = String(data);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast.success('JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative rounded-lg bg-secondary-bg border border-border overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-panel border-b border-border text-xs text-text-secondary">
        <span className="font-mono">JSON</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-text-primary px-2 py-0.5 rounded transition-colors text-xs"
          title="Copy JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed max-h-96">
        <code>{formatted}</code>
      </pre>
    </div>
  );
};
