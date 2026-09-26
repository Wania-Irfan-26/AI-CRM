/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { fetchLeads, approveLead, rejectLead } from './services/api';
// mockData.ts is kept in the project but no longer used as the live data source.
import { Lead, NavTab, FilterTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QueueView } from './components/QueueView';
import { LeadsView } from './components/LeadsView';
import { ApprovedView } from './components/ApprovedView';
import { RejectedView } from './components/RejectedView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';

// Persist sidebar + theme across refreshes
const SIDEBAR_KEY = 'crm_sidebar_collapsed';
const THEME_KEY   = 'crm_theme';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeLeadId, setActiveLeadId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [focusLeadId, setFocusLeadId] = useState<string | null>(null);

  // Sidebar collapse state — persisted
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  });

  // Theme state — persisted
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') ?? 'dark';
  });

  // Apply sidebar width CSS variable + theme attribute whenever they change
  useEffect(() => {
    const width = sidebarCollapsed ? '3.5rem' : '15rem';
    document.documentElement.style.setProperty('--sidebar-width', width);
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleTheme   = () => setTheme((t) => t === 'dark' ? 'light' : 'dark');

  // Fetch leads from the FastAPI backend on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLeads() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const fetched = await fetchLeads();
        if (!cancelled) {
          setLeads(fetched);
          // Auto-select the first pending lead if one exists
          const firstPending = fetched.find((l) => l.status === 'pending');
          if (firstPending) setActiveLeadId(firstPending.id);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Unable to load leads from the server.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLeads();
    return () => { cancelled = true; };
  }, []);

  // Counts
  const pendingLeads = leads.filter((l) => l.status === 'pending');
  const approvedLeads = leads.filter((l) => l.status === 'approved');
  const rejectedLeads = leads.filter((l) => l.status === 'rejected');

  const handleApproveLead = (leadId: string) => {
    approveLead(leadId)
      .then(({ recipient }) => {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: 'approved',
                  approvedAt: `Today at ${new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`,
                  dispatchedSequence: `Sent to ${recipient}`,
                }
              : l
          )
        );
        const remainingPending = leads.filter((l) => l.status === 'pending' && l.id !== leadId);
        if (remainingPending.length > 0) setActiveLeadId(remainingPending[0].id);
      })
      .catch((err: unknown) => {
        setActionError(
          `Could not send email. ${err instanceof Error ? err.message : 'Please retry.'}`
        );
        setTimeout(() => setActionError(null), 5000);
      });
  };

  const handleRejectLead = (leadId: string, reason: string) => {
    rejectLead(leadId, reason)
      .then(() => {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: 'rejected', rejectionReason: reason } : l
          )
        );
        const remainingPending = leads.filter((l) => l.status === 'pending' && l.id !== leadId);
        if (remainingPending.length > 0) setActiveLeadId(remainingPending[0].id);
      })
      .catch((err: unknown) => {
        setActionError(
          `Could not reject lead. ${err instanceof Error ? err.message : 'Please retry.'}`
        );
        setTimeout(() => setActionError(null), 5000);
      });
  };

  const handleUpdateDraft = (leadId: string, subject: string, body: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, coldEmail: { ...l.coldEmail, subject, body } }
          : l
      )
    );
  };

  const handleReconsiderLead = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, status: 'pending', rejectionReason: undefined } : l
      )
    );
    setActiveLeadId(leadId);
    setActiveTab('ai-emails');
  };

  const handleRefreshSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    fetchLeads()
      .then((fetched) => {
        setLeads(fetched);
        const firstPending = fetched.find((l) => l.status === 'pending');
        if (firstPending) setActiveLeadId(firstPending.id);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Sync failed.');
      })
      .finally(() => setIsSyncing(false));
  };

  // ---------------------------------------------------------------------------
  // Loading / error screens — visually consistent with the existing dark theme
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--c-amber)] border-t-transparent animate-spin" />
          <span className="text-[12px] text-[var(--c-text-subtle)] font-medium">
            Connecting to pipeline…
          </span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center p-6 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-sm">
          <div className="w-10 h-10 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-['Manrope'] text-[15px] font-bold text-[var(--c-text)]">
              Unable to load leads
            </h2>
            <p className="text-[11px] text-[var(--c-text-muted)] mt-1 leading-relaxed">
              {loadError.length > 120 ? 'Could not reach the backend API.' : loadError}
            </p>
          </div>
          <div className="text-[11px] text-[var(--c-text-subtle)]">
            Make sure the FastAPI server is running at{' '}
            <span className="font-mono text-[var(--c-amber)]">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </span>
          </div>
          <button
            onClick={handleRefreshSync}
            className="px-4 py-1.5 rounded-md bg-[var(--c-amber)] hover:bg-[var(--c-accent-hover)] text-[var(--c-accent-on)] text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main app
  // ---------------------------------------------------------------------------

  return (
    <div id="vanguard-sales-app" className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        pendingCount={pendingLeads.length}
        approvedCount={approvedLeads.length}
        rejectedCount={rejectedLeads.length}
        totalLeadsCount={leads.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div
        id="main-content-wrapper"
        className="flex-1 flex flex-col min-w-0"
        style={{ paddingLeft: sidebarCollapsed ? '3.5rem' : '15rem' }}
      >
        <Header
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Action error banner */}
        {actionError && (
          <div className="fixed top-13 left-0 right-0 z-30 flex justify-center px-6 pt-2" style={{ paddingLeft: sidebarCollapsed ? '3.5rem' : '15rem' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-rose-600 text-white text-[11px] font-medium shadow-lg max-w-lg w-full">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="flex-1">{actionError}</span>
              <button onClick={() => setActionError(null)} className="text-white/70 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
          </div>
        )}

        <main className="w-full pt-13 bg-[var(--c-bg)] px-6 min-h-screen">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onActionClick={(leadId) => {
                setFocusLeadId(leadId);
                setActiveTab('approved');
              }}
            />
          )}

          {activeTab === 'ai-emails' && (
            <QueueView
              leads={leads}
              activeLeadId={activeLeadId}
              setActiveLeadId={setActiveLeadId}
              onApproveLead={handleApproveLead}
              onRejectLead={handleRejectLead}
              onUpdateDraft={handleUpdateDraft}
              filterTab={filterTab}
              setFilterTab={setFilterTab}
              onRefreshSync={handleRefreshSync}
              isSyncing={isSyncing}
              searchQuery={globalSearch}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              onSelectLeadForReview={(id) => setActiveLeadId(id)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'approved' && (
            <ApprovedView
              approvedLeads={approvedLeads}
              focusLeadId={focusLeadId}
              onFocusHandled={() => setFocusLeadId(null)}
            />
          )}

          {activeTab === 'rejected' && (
            <RejectedView
              rejectedLeads={rejectedLeads}
              onReconsiderLead={handleReconsiderLead}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
