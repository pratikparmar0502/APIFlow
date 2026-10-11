import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Server, Shield, RefreshCw } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [apiEndpoint, setApiEndpoint] = useState('/api/v1');
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  const checkHealth = async () => {
    setStatus('checking');
    const start = performance.now();
    try {
      await apiClient.get('/health', { timeout: 4000 });
      setLatency(Math.round(performance.now() - start));
      setStatus('connected');
      toast.success('Backend server reachable');
    } catch {
      setStatus('disconnected');
      setLatency(null);
      toast.error('Could not reach backend');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Settings" />

      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Backend Connection */}
        <div className="p-6 bg-panel border border-border rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Server className="w-4 h-4 text-yellow" />
            <h3 className="text-sm font-semibold text-text-primary">
              Backend API Connection
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-primary">Server Status</p>
                <p className="text-xs text-text-secondary">
                  Local proxy route pointing to backend instance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                    status === 'connected'
                      ? 'bg-success/10 text-success border-success/30'
                      : status === 'disconnected'
                      ? 'bg-failure/10 text-failure border-failure/30'
                      : 'bg-yellow/10 text-yellow border-yellow/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'connected'
                        ? 'bg-success'
                        : status === 'disconnected'
                        ? 'bg-failure'
                        : 'bg-yellow animate-pulse'
                    }`}
                  />
                  {status === 'connected'
                    ? `Connected (${latency}ms)`
                    : status === 'disconnected'
                    ? 'Disconnected'
                    : 'Checking...'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkHealth}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Check
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-medium text-text-secondary block mb-1">
                API Base Path (Configured)
              </label>
              <input
                type="text"
                value={apiEndpoint}
                readOnly
                className="w-full max-w-md bg-secondary-bg/60 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-secondary cursor-not-allowed focus:outline-none"
              />
              <p className="text-[11px] text-text-secondary/70 mt-1.5">
                The API base route is configured via the local Vite proxy pointing to the APIFlow Express backend.
              </p>
            </div>
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="p-6 bg-panel border border-border rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Shield className="w-4 h-4 text-yellow" />
            <h3 className="text-sm font-semibold text-text-primary">About APIFlow</h3>
          </div>

          <div className="text-xs text-text-secondary space-y-2 leading-relaxed">
            <p>
              <strong className="text-text-primary">APIFlow</strong> is an enterprise-grade visual API orchestration and automated testing platform designed with high resilience and real-time execution.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
              <div className="p-3 bg-secondary-bg rounded-lg border border-border">
                <span className="text-text-secondary block">Frontend Engine:</span>
                <span className="text-text-primary">React 18 + Vite + TypeScript</span>
              </div>
              <div className="p-3 bg-secondary-bg rounded-lg border border-border">
                <span className="text-text-secondary block">Visual Canvas:</span>
                <span className="text-text-primary">@xyflow/react</span>
              </div>
              <div className="p-3 bg-secondary-bg rounded-lg border border-border">
                <span className="text-text-secondary block">Styling:</span>
                <span className="text-text-primary">Tailwind CSS (Black & Yellow theme)</span>
              </div>
              <div className="p-3 bg-secondary-bg rounded-lg border border-border">
                <span className="text-text-secondary block">State & Storage:</span>
                <span className="text-text-primary">Zustand + REST API Persistence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
