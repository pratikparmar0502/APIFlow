import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  Zap,
  Clock,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Workflow as LogoIcon,
} from 'lucide-react';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewWorkflow: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onNewWorkflow,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/workflows', label: 'Workflows', icon: GitBranch },
    { to: '/tester', label: 'API Tester', icon: Zap },
    { to: '/history', label: 'History', icon: Clock },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen bg-secondary-bg border-r border-border transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-yellow flex items-center justify-center text-app-bg shadow-md shrink-0">
            <LogoIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-text-primary">
                APIFlow
              </span>
              <span className="text-[10px] text-text-secondary leading-none">
                Visual Automation
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Action CTA */}
      <div className="p-3">
        <button
          onClick={onNewWorkflow}
          className={`w-full flex items-center justify-center gap-2 bg-yellow hover:bg-yellow-hover text-app-bg font-semibold rounded-lg transition-all shadow-sm py-2 px-3 text-sm ${
            collapsed ? 'px-0' : ''
          }`}
          title="Create Workflow"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          {!collapsed && <span>New Workflow</span>}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-panel text-yellow border-l-2 border-yellow font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-panel/50'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle footer */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        {!collapsed && (
          <span className="text-[11px] text-text-secondary/70">v1.0.0 Pro</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-panel transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
