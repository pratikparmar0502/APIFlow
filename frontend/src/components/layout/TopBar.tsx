import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, actions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

        {/* User profile & logout */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="flex items-center gap-2" title={user.email}>
              <div className="w-7 h-7 rounded-full bg-yellow/20 border border-yellow/40 flex items-center justify-center text-yellow font-bold text-xs uppercase">
                {user.name ? user.name.charAt(0) : user.email.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-text-primary leading-tight max-w-[120px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-text-secondary leading-tight max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-text-secondary hover:text-failure hover:bg-panel transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
