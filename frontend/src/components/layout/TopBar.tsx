import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../api/client';

export interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, actions }) => {
  const location = useLocation();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        await apiClient.get('/health', { timeout: 3000 });
        if (mounted) setBackendHealthy(true);
      } catch {
        if (mounted) setBackendHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getBreadcrumb = () => {
    if (title) return title;
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/workflows/new')) return 'New Workflow';
    if (path.startsWith('/workflows')) return 'Workflows';
    if (path.startsWith('/tester')) return 'API Explorer';
    if (path.startsWith('/history')) return 'Execution History';
    if (path.startsWith('/settings')) return 'Settings';
    return 'APIFlow';
  };

  return (
    <header className="h-16 bg-secondary-bg/80 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-text-primary tracking-tight">
          {getBreadcrumb()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Backend health status pill */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-panel border border-border text-[11px] text-text-secondary"
          title={
            backendHealthy === true
              ? 'Backend API Connected'
              : backendHealthy === false
              ? 'Backend API Disconnected'
              : 'Checking API status...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy === true
                ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                : backendHealthy === false
                ? 'bg-failure shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                : 'bg-yellow shadow-[0_0_8px_rgba(245,217,10,0.6)] animate-pulse'
            }`}
          />
          <span className="font-mono">
            {backendHealthy === true
              ? 'API Online'
              : backendHealthy === false
              ? 'API Offline'
              : 'Checking'}
          </span>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
