import React from 'react';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  Users,
  Bot,
  CheckCircle,
  XCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalLeadsCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

interface NavItem {
  tab: NavTab;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  approvedCount,
  rejectedCount,
  totalLeadsCount,
  collapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
}) => {
  const navItems: NavItem[] = [
    {
      tab: 'dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      label: 'Dashboard',
    },
    {
      tab: 'leads',
      icon: <Users className="w-4 h-4 shrink-0" />,
      label: 'Leads',
      badge: !collapsed ? (
        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--c-hover-bg)] text-[var(--c-text-muted)] font-medium border border-[var(--c-border)]">
          {totalLeadsCount}
        </span>
      ) : undefined,
    },
    {
      tab: 'ai-emails',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      label: 'AI Emails',
      badge: !collapsed && pendingCount > 0 ? (
        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--c-amber-bg)] text-[var(--c-amber)] font-semibold border border-[var(--c-active-border)]">
          {pendingCount}
        </span>
      ) : undefined,
    },
    {
      tab: 'approved',
      icon: <CheckCircle className="w-4 h-4 shrink-0" />,
      label: 'Approved',
      badge: !collapsed && approvedCount > 0 ? (
        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--c-green-bg)] text-[var(--c-green)] font-semibold border border-emerald-500/20">
          {approvedCount}
        </span>
      ) : undefined,
    },
    {
      tab: 'rejected',
      icon: <XCircle className="w-4 h-4 shrink-0" />,
      label: 'Rejected',
      badge: !collapsed && rejectedCount > 0 ? (
        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--c-red-bg)] text-[var(--c-red)] font-semibold border border-rose-500/20">
          {rejectedCount}
        </span>
      ) : undefined,
    },
    {
      tab: 'settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      label: 'Settings',
    },
  ];

  return (
    <aside
      id="main-sidebar"
      style={{ width: collapsed ? '3.5rem' : '15rem' }}
      className="fixed left-0 top-0 h-full bg-[var(--c-bg-card)] z-50 flex flex-col border-r border-[var(--c-border)] transition-[width] duration-200"
    >
      {/* Brand header */}
      <div
        id="sidebar-brand-header"
        className="h-13 flex items-center bg-[var(--c-bg-card)] border-b border-[var(--c-border)] shrink-0 overflow-hidden px-3"
      >
        {collapsed ? (
          /* Collapsed mark */
          <div className="w-full flex items-center justify-center">
            <div className="w-7 h-7 rounded-md bg-[var(--c-amber)] text-[var(--c-accent-on)] font-bold flex items-center justify-center text-xs shadow-sm">
              V
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 w-full">
            <div className="w-7 h-7 rounded-md bg-[var(--c-amber)] text-[var(--c-accent-on)] font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              V
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-['Manrope'] text-[13px] font-semibold text-[var(--c-text)] truncate leading-tight">
                  Vanguard CRM
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[var(--c-amber-bg)] text-[var(--c-amber)] border border-[var(--c-active-border)] leading-none">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-[var(--c-text-subtle)] truncate">
                Sales Pipeline
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        id="sidebar-nav"
        className="flex flex-col gap-0.5 px-2 py-3 flex-1 overflow-y-auto overflow-x-hidden"
      >
        {!collapsed && (
          <span className="px-2 py-1 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
            Workspace
          </span>
        )}

        {navItems.map(({ tab, icon, label, badge }) => {
          const isActive = activeTab === tab;
          return (
            <div key={tab} className="relative sidebar-nav-item">
              <button
                onClick={() => setActiveTab(tab)}
                className={`sidebar-nav-btn w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors duration-150 text-[13px] font-medium
                  ${isActive
                    ? 'sidebar-active bg-[var(--c-active-bg)] text-[var(--c-active-text)] font-semibold border border-[var(--c-active-border)]'
                    : 'text-[var(--c-text-muted)] hover:bg-[var(--c-hover-bg)] hover:text-[var(--c-text)] border border-transparent'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? label : undefined}
              >
                {icon}
                {!collapsed && (
                  <span className="truncate">
                    {label}
                  </span>
                )}
                {badge}
              </button>

              {/* Tooltip — only when collapsed */}
              {collapsed && (
                <span className="sidebar-tooltip">{label}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer controls — theme toggle + collapse toggle */}
      <div className="px-2 py-2 border-t border-[var(--c-border)] shrink-0 flex flex-col gap-0.5 bg-[var(--c-bg-card)]">
        {/* Theme toggle */}
        <div className="relative sidebar-nav-item">
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-[var(--c-text-muted)] hover:bg-[var(--c-hover-bg)] hover:text-[var(--c-text)] transition-colors duration-150 border border-transparent ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 shrink-0 text-amber-400" />
              : <Moon className="w-4 h-4 shrink-0 text-slate-600" />
            }
            {!collapsed && (
              <span className="truncate">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>
          {collapsed && (
            <span className="sidebar-tooltip">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="relative sidebar-nav-item">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-[var(--c-text-muted)] hover:bg-[var(--c-hover-bg)] hover:text-[var(--c-text)] transition-colors duration-150 border border-transparent ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Expand sidebar' : undefined}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
              : <PanelLeftClose className="w-4 h-4 shrink-0" />
            }
            {!collapsed && (
              <span className="truncate">
                Collapse sidebar
              </span>
            )}
          </button>
          {collapsed && (
            <span className="sidebar-tooltip">Expand sidebar</span>
          )}
        </div>
      </div>
    </aside>
  );
};
