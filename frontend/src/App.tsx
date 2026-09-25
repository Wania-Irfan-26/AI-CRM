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

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>('ai-emails');
  const [activeLeadId, setActiveLeadId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
        alert(
          `Failed to send email:\n${err instanceof Error ? err.message : String(err)}`
        );
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
        alert(
          `Failed to reject lead:\n${err instanceof Error ? err.message : String(err)}`
        );
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
      <div className="min-h-screen bg-[#0f131c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#f2ca50] border-t-transparent animate-spin" />
          <span className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
            Loading leads...
          </span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0f131c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-xl bg-[#181c24] border border-white/5">
          <span className="text-3xl">⚠️</span>
          <h2 className="font-['Manrope'] text-[20px] font-bold text-[#dfe2ee]">
            Unable to load leads
          </h2>
          <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af] leading-relaxed">
            {loadError}
          </p>
          <p className="font-['Hanken_Grotesk'] text-[12px] text-[#99907c]">
            Make sure the FastAPI backend is running on{' '}
            <span className="text-[#f2ca50] font-mono">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </span>
          </p>
          <button
            onClick={handleRefreshSync}
            className="px-5 py-2 rounded-lg bg-[#f2ca50] text-[#3c2f00] font-bold text-sm hover:bg-[#d4af37] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main app
  // ---------------------------------------------------------------------------

  return (
    <div id="vanguard-sales-app" className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex">
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
      />

      <div className="pl-64 flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="w-full pt-16 bg-[#0f131c] px-6 min-h-screen">
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

          {activeTab === 'approved' && <ApprovedView approvedLeads={approvedLeads} />}

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
