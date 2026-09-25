import React, { useState, useEffect } from 'react';
import { Lead, FilterTab, EmailVersion } from '../types';
import {
  RotateCw,
  Search,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Share2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Radio,
  Edit3,
  Bot,
  History,
  Save,
  X,
  Send,
  Check,
  CheckCircle,
} from 'lucide-react';
import { RejectModal } from './RejectModal';
import { VersionHistoryModal } from './VersionHistoryModal';

interface QueueViewProps {
  leads: Lead[];
  activeLeadId: string;
  setActiveLeadId: (id: string) => void;
  onApproveLead: (leadId: string) => void;
  onRejectLead: (leadId: string, reason: string) => void;
  onUpdateDraft: (leadId: string, subject: string, body: string) => void;
  filterTab: FilterTab;
  setFilterTab: (filter: FilterTab) => void;
  onRefreshSync: () => void;
  isSyncing: boolean;
  searchQuery: string;
}

export const QueueView: React.FC<QueueViewProps> = ({
  leads,
  activeLeadId,
  setActiveLeadId,
  onApproveLead,
  onRejectLead,
  onUpdateDraft,
  filterTab,
  setFilterTab,
  onRefreshSync,
  isSyncing,
  searchQuery,
}) => {
  const pendingLeads = leads.filter((l) => l.status === 'pending');

  // Local filter within queue
  const [localSearch, setLocalSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  // Modals & Polish state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(true);

  // Active lead
  const currentLead =
    pendingLeads.find((l) => l.id === activeLeadId) || pendingLeads[0] || leads[0];

  // Editable fields for active lead
  const [subjectInput, setSubjectInput] = useState(currentLead?.coldEmail?.subject || '');
  const [bodyInput, setBodyInput] = useState(currentLead?.coldEmail?.body || '');
  const [activeVariant, setActiveVariant] = useState<'crew' | 'direct'>('crew');

  useEffect(() => {
    if (currentLead) {
      setSubjectInput(currentLead.coldEmail.subject);
      setBodyInput(currentLead.coldEmail.body);
      setActiveVariant(currentLead.coldEmail.activeVariant === 'direct' ? 'direct' : 'crew');
      setIsAutoSaved(true);
    }
  }, [currentLead?.id]);

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBodyInput(val);
    setIsAutoSaved(false);
    onUpdateDraft(currentLead.id, subjectInput, val);
    setTimeout(() => setIsAutoSaved(true), 800);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSubjectInput(val);
    setIsAutoSaved(false);
    onUpdateDraft(currentLead.id, val, bodyInput);
    setTimeout(() => setIsAutoSaved(true), 800);
  };

  // Word count calculation
  const wordCount = bodyInput.trim() ? bodyInput.trim().split(/\s+/).length : 0;

  // Filter pending leads
  const filteredPendingLeads = pendingLeads
    .filter((lead) => {
      // Global and local search
      const q = (searchQuery || localSearch).toLowerCase().trim();
      if (q) {
        const matchesName = lead.companyName.toLowerCase().includes(q);
        const matchesPersona = lead.personaName.toLowerCase().includes(q);
        const matchesDomain = lead.domain.toLowerCase().includes(q);
        const matchesRec = lead.recApi.toLowerCase().includes(q);
        const matchesPain = lead.detectedPain.description.toLowerCase().includes(q);
        if (!matchesName && !matchesPersona && !matchesDomain && !matchesRec && !matchesPain) {
          return false;
        }
      }

      // Filter tabs
      if (filterTab === 'high-score') return lead.matchScore >= 90;
      if (filterTab === 'fintech') return lead.category === 'Fintech & SaaS';
      if (filterTab === 'supply-chain') return lead.category === 'Supply Chain & Logistics';
      return true;
    })
    .sort((a, b) => (sortDesc ? b.matchScore - a.matchScore : a.matchScore - b.matchScore));

  const handleVariantSwitch = (variant: 'crew' | 'direct') => {
    setActiveVariant(variant);
    if (!currentLead) return;
    if (variant === 'direct') {
      const directSubject = `Quick question re: ${currentLead.companyName}'s ${currentLead.detectedPain.code} backlog`;
      const directBody = `${currentLead.personaName.split(' ')[0]},\n\nSaw your team is managing massive volume. Most operators lose 3-5% margin to ${currentLead.detectedPain.code} reconciliation disputes.\n\nOur ${currentLead.recApi} automates this in under 2 seconds.\n\nWorth a quick 5-min intro this week?\n\nAlex Mercer\nVanguard`;
      setSubjectInput(directSubject);
      setBodyInput(directBody);
      onUpdateDraft(currentLead.id, directSubject, directBody);
    } else {
      // Revert to crew draft
      const baseSubject = currentLead.coldEmail.subject;
      const baseBody = currentLead.coldEmail.body;
      setSubjectInput(baseSubject);
      setBodyInput(baseBody);
      onUpdateDraft(currentLead.id, baseSubject, baseBody);
    }
  };

  const handleApprove = () => {
    if (!currentLead) return;
    setIsApproving(true);

    setTimeout(() => {
      setIsApproving(false);
      const leadName = currentLead.companyName;
      const contactName = currentLead.personaName;
      onApproveLead(currentLead.id);

      setToastMessage({
        title: 'Email Dispatched to Queue',
        subtitle: `Scheduled for ${contactName} (${leadName}) • Q4 Peak Sequence`,
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }, 700);
  };

  const handleRestoreVersion = (version: EmailVersion) => {
    setSubjectInput(version.subject);
    setBodyInput(version.body);
    if (currentLead) {
      onUpdateDraft(currentLead.id, version.subject, version.body);
    }
  };

  return (
    <div id="queue-view-container" className="flex flex-col w-full pb-10">
      {/* Top Command & Synchronicity Bar */}
      <header id="queue-header-command-bar" className="flex flex-col gap-4 py-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-['Manrope'] text-[28px] leading-[36px] font-semibold text-[#dfe2ee] tracking-tight">
                AI Email Review & Approval Queue
              </h1>
              <span
                id="priority-dispatch-badge"
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f2ca50]/15 text-[#f2ca50] font-['Hanken_Grotesk'] text-[11px] font-semibold tracking-wide border border-[#f2ca50]/20"
              >
                PRIORITY DISPATCH
              </span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
              {pendingLeads.length} leads processed by CrewAI orchestration agent awaiting executive validation & transmission authorization.
            </p>
          </div>

          {/* Sync Telemetry Pill */}
          <div
            id="queue-sync-telemetry-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2028] border border-white/5 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58e7aa] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58e7aa]"></span>
            </span>
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
              Google Sheets:{' '}
              <span className="text-[#dfe2ee] font-semibold">“Q3 Enterprise Inbound v2”</span>
            </span>
            <span className="text-[#99907c] text-xs">•</span>
            <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
              {isSyncing ? 'Syncing...' : 'Synced 4m ago'}
            </span>
            <button
              id="refresh-sync-btn"
              onClick={onRefreshSync}
              className="ml-1 text-[#d0c5af] hover:text-[#f2ca50] transition-colors flex items-center p-0.5 rounded hover:bg-white/5"
              title="Refresh Google Sheets data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#f2ca50]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Control Strips & Review Pace */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div id="filter-tab-buttons" className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              id="filter-all-btn"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm ${
                filterTab === 'all'
                  ? 'bg-[#31353e] text-[#f2ca50] border border-[#f2ca50]/20'
                  : 'bg-[#181c24] hover:bg-[#1c2028] text-[#d0c5af] hover:text-[#dfe2ee]'
              }`}
            >
              <span>All Pending</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#f2ca50] text-[#3c2f00] text-[12px] font-bold">
                {pendingLeads.length}
              </span>
            </button>

            <button
              id="filter-high-score-btn"
              onClick={() => setFilterTab('high-score')}
              className={`px-3 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-[13px] transition-all flex items-center gap-2 ${
                filterTab === 'high-score'
                  ? 'bg-[#31353e] text-[#f2ca50] font-semibold border border-[#f2ca50]/20'
                  : 'bg-[#181c24] hover:bg-[#1c2028] text-[#d0c5af] hover:text-[#dfe2ee]'
              }`}
            >
              <span>High Match Score (&gt;90%)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#31353e] text-[#58e7aa] text-[12px] font-bold">
                {pendingLeads.filter((l) => l.matchScore >= 90).length}
              </span>
            </button>

            <button
              id="filter-fintech-btn"
              onClick={() => setFilterTab('fintech')}
              className={`px-3 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-[13px] transition-all ${
                filterTab === 'fintech'
                  ? 'bg-[#31353e] text-[#f2ca50] font-semibold border border-[#f2ca50]/20'
                  : 'bg-[#181c24] hover:bg-[#1c2028] text-[#d0c5af] hover:text-[#dfe2ee]'
              }`}
            >
              Fintech & SaaS
            </button>

            <button
              id="filter-supply-chain-btn"
              onClick={() => setFilterTab('supply-chain')}
              className={`px-3 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-[13px] transition-all ${
                filterTab === 'supply-chain'
                  ? 'bg-[#31353e] text-[#f2ca50] font-semibold border border-[#f2ca50]/20'
                  : 'bg-[#181c24] hover:bg-[#1c2028] text-[#d0c5af] hover:text-[#dfe2ee]'
              }`}
            >
              Supply Chain & Logistics
            </button>
          </div>

          <div id="review-pace-indicator" className="flex items-center gap-2">
            <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">Review Pace:</span>
            <div className="h-2 w-28 bg-[#31353e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f2ca50] transition-all duration-500"
                style={{
                  width: `${
                    leads.length > 0
                      ? Math.round(
                          ((leads.filter((l) => l.status !== 'pending').length) /
                            leads.length) *
                            100
                        )
                      : 66
                  }%`,
                }}
              ></div>
            </div>
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#f2ca50] font-semibold">
              {leads.length > 0
                ? Math.round(
                    ((leads.filter((l) => l.status !== 'pending').length) /
                      leads.length) *
                      100
                  )
                : 66}
              % complete
            </span>
          </div>
        </div>
      </header>

      {/* Two-Column Master/Detail Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Lead Queue & Inbound Feed (5 cols desktop) */}
        <section id="lead-queue-column" className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {/* Search & Sorting Filter Strip */}
          <div
            id="queue-search-filter-card"
            className="p-3.5 rounded-xl bg-[#181c24] shadow-sm flex flex-col gap-2 border border-white/5"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#d0c5af]" />
              <input
                id="queue-local-search-input"
                className="w-full bg-[#1c2028] pl-9 pr-4 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-[13px] text-[#dfe2ee] placeholder:text-[#d0c5af]/60 border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
                placeholder="Search accounts, personas, pain points..."
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] px-1">
              <span>
                Sort:{' '}
                <button
                  id="toggle-sort-btn"
                  onClick={() => setSortDesc(!sortDesc)}
                  className="text-[#dfe2ee] font-medium hover:text-[#f2ca50] transition-colors inline-flex items-center gap-1"
                >
                  Match Score ({sortDesc ? 'Desc ↓' : 'Asc ↑'})
                </button>
              </span>
              <span>
                Showing {filteredPendingLeads.length} of {pendingLeads.length} active
              </span>
            </div>
          </div>

          {/* Lead Cards Flow */}
          <div id="lead-cards-list" className="flex flex-col gap-2">
            {filteredPendingLeads.length === 0 ? (
              <div className="p-8 text-center bg-[#181c24] rounded-xl border border-white/5 text-[#d0c5af]">
                <CheckCircle className="w-8 h-8 mx-auto text-[#58e7aa] mb-2 opacity-80" />
                <p className="font-semibold text-[#dfe2ee]">All leads reviewed in this view!</p>
                <p className="text-xs mt-1">Switch filters or add new leads from Google Sheets.</p>
              </div>
            ) : (
              filteredPendingLeads.map((lead) => {
                const isSelected = lead.id === currentLead?.id;
                return (
                  <article
                    key={lead.id}
                    id={`lead-card-${lead.id}`}
                    onClick={() => setActiveLeadId(lead.id)}
                    className={`p-4 rounded-xl transition-all relative overflow-hidden group cursor-pointer border ${
                      isSelected
                        ? 'bg-[#262a33] shadow-md border-white/10'
                        : 'bg-[#181c24] hover:bg-[#1c2028] shadow-sm border-white/5'
                    }`}
                  >
                    {/* Left Gold Focus Indicator Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f2ca50]"></div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-1.5 pl-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-['Manrope'] text-[15px] text-[#dfe2ee] font-semibold truncate group-hover:text-[#f2ca50] transition-colors">
                          {lead.companyName}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded bg-[#0a0e16] font-['Hanken_Grotesk'] text-[11px] text-[#bcc7de] border border-white/5">
                          {lead.domain}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-['Hanken_Grotesk'] text-[11px] font-semibold ${
                            lead.matchScore >= 90
                              ? 'bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/20'
                              : 'bg-[#31353e] text-[#bcc7de]'
                          }`}
                        >
                          {lead.matchScore >= 90 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f2ca50] animate-pulse"></span>
                          )}
                          {lead.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <div className="pl-1 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#dfe2ee] font-medium">{lead.personaName}</span>
                        <span className="text-[#d0c5af] text-[11px]">{lead.personaTitle}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded bg-[#1c2028] text-xs text-[#d0c5af] flex items-center justify-between border border-white/5">
                        <span className="truncate">
                          <strong className="text-[#bcc7de] font-medium">Rec:</strong>{' '}
                          {lead.recApi}
                        </span>
                        <span className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] shrink-0 ml-2">
                          {lead.timeAgo}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Live Stream Agent Pulse */}
          <div
            id="agent-pulse-footer"
            className="p-3 rounded-lg bg-[#0a0e16] border border-white/5 flex items-center justify-between shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#f2ca50] animate-spin" />
              <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
                Worker Agent <span className="text-[#dfe2ee] font-semibold">Apollo-7</span> scraping
                outbound signals...
              </span>
            </div>
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#58e7aa] font-medium">
              Running
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: Intelligence Dossier & AI Email Approver (7 cols desktop) */}
        {currentLead ? (
          <section id="lead-dossier-column" className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            {/* A. Lead & Company Intelligence Dossier */}
            <div
              id="intelligence-dossier-card"
              className="p-6 rounded-xl bg-[#1c2028] shadow-md flex flex-col gap-4 border border-white/5"
            >
              {/* Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-white/5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-['Manrope'] text-[20px] text-[#dfe2ee] font-bold">
                      {currentLead.companyName}
                    </h2>
                    <CheckCircle2
                      className="w-4 h-4 text-[#f2ca50]"
                      title="Verified Enterprise Account"
                    />
                    <a
                      className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors flex items-center ml-1"
                      href={`https://${currentLead.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open Company Site"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        setToastMessage({
                          title: 'Link Copied',
                          subtitle: `Dossier for ${currentLead.companyName} copied to clipboard`,
                        });
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="text-[#d0c5af] hover:text-[#d8e3fb] transition-colors flex items-center"
                      title="Share Dossier"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
                    <span>HQ: {currentLead.hq}</span>
                    <span>•</span>
                    <span>{currentLead.employees}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-[#262a33] text-[#f2ca50] font-medium border border-white/5">
                      {currentLead.fundingStage}
                    </span>
                  </div>
                </div>

                {/* Overall Fit Score Pill */}
                <div
                  id="agent-fit-score-box"
                  className="flex items-center gap-2.5 p-1.5 px-3 rounded-lg bg-[#262a33] border border-white/5"
                >
                  <div className="flex flex-col items-end">
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] uppercase font-medium">
                      Agent Match
                    </span>
                    <span className="font-['Manrope'] text-[16px] text-[#f2ca50] font-bold leading-tight">
                      {currentLead.matchScore}% Fit
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#f2ca50]/20 flex items-center justify-center text-[#f2ca50]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Contact Persona Ribbon */}
              <div
                id="contact-persona-ribbon"
                className="p-2.5 rounded-lg bg-[#181c24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#31353e] flex items-center justify-center text-[#f2ca50] font-bold text-xs border border-white/10">
                    {currentLead.personaInitials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Hanken_Grotesk'] text-[14px] text-[#dfe2ee] font-semibold">
                      {currentLead.personaName} —{' '}
                      <span className="text-[#bcc7de] font-normal">{currentLead.personaTitle}</span>
                    </span>
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c]">
                      {currentLead.personaEmail}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#bcc7de] bg-[#1c2028] px-2.5 py-1 rounded border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-[#99907c]" />
                  <span>{currentLead.linkedinSignal}</span>
                </div>
              </div>

              {/* Company Context Summary */}
              <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af] leading-relaxed">
                {currentLead.companySummary}
              </p>

              {/* AI Insight Matrix (3 Diagnostic Blocks) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {/* Insight 1: Pain Point */}
                <div className="p-3 rounded-lg bg-[#181c24] flex flex-col gap-1.5 shadow-sm border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#ffb4ab] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Detected Pain
                    </span>
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] bg-[#0a0e16] px-1.5 py-0.5 rounded">
                      {currentLead.detectedPain.code}
                    </span>
                  </div>
                  <p className="font-['Hanken_Grotesk'] text-[12px] text-[#dfe2ee] leading-normal">
                    {currentLead.detectedPain.description}
                  </p>
                </div>

                {/* Insight 2: Recommended Pitch */}
                <div className="p-3 rounded-lg bg-[#181c24] flex flex-col gap-1.5 shadow-sm border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#f2ca50] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Recommended Service
                    </span>
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#58e7aa] font-semibold">
                      {currentLead.recommendedPitch.fitLevel}
                    </span>
                  </div>
                  <p className="font-['Hanken_Grotesk'] text-[12px] text-[#dfe2ee] leading-normal">
                    {currentLead.recommendedPitch.description}
                  </p>
                </div>

                {/* Insight 3: Signal */}
                <div className="p-3 rounded-lg bg-[#181c24] flex flex-col gap-1.5 shadow-sm border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#58e7aa] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5" />
                      AI Sales Signal
                    </span>
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] bg-[#0a0e16] px-1.5 py-0.5 rounded">
                      {currentLead.crewAiSignal.source}
                    </span>
                  </div>
                  <p className="font-['Hanken_Grotesk'] text-[12px] text-[#dfe2ee] leading-normal">
                    {currentLead.crewAiSignal.description}
                  </p>
                </div>
              </div>

              {/* Confidence Dimension Bars */}
              <div className="p-2.5 px-3 rounded-lg bg-[#0a0e16] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] font-medium shrink-0">
                  Model Confidence Vectors:
                </span>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex flex-col gap-1 flex-1 sm:w-24">
                    <div className="flex justify-between text-[10px] text-[#d0c5af]">
                      <span>Pain Match</span>
                      <span className="text-[#58e7aa] font-bold">
                        {currentLead.confidenceVectors.painMatch}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#262a33] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#58e7aa]"
                        style={{ width: `${currentLead.confidenceVectors.painMatch}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 sm:w-24">
                    <div className="flex justify-between text-[10px] text-[#d0c5af]">
                      <span>Buyer Persona</span>
                      <span className="text-[#f2ca50] font-bold">
                        {currentLead.confidenceVectors.buyerPersona}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#262a33] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f2ca50]"
                        style={{ width: `${currentLead.confidenceVectors.buyerPersona}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 sm:w-24">
                    <div className="flex justify-between text-[10px] text-[#d0c5af]">
                      <span>Stack Match</span>
                      <span className="text-[#58e7aa] font-bold">
                        {currentLead.confidenceVectors.stackMatch}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#262a33] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#58e7aa]"
                        style={{ width: `${currentLead.confidenceVectors.stackMatch}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Prominent AI Cold Email Review & Action Card */}
            <div
              id="email-review-card"
              className="p-6 rounded-xl bg-[#262a33] shadow-xl flex flex-col gap-4 relative overflow-hidden border border-white/10"
            >
              {/* Top Accent Ambient Lighting */}
              <div className="absolute -top-24 right-0 w-96 h-48 bg-[#f2ca50]/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Header & Version Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#d4af37] text-[#3c2f00] flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Manrope'] text-[16px] text-[#dfe2ee] font-bold">
                        Generated Cold Email Draft #1
                      </h3>
                      <span className="px-1.5 py-0.2 rounded bg-[#1c2028] font-['Hanken_Grotesk'] text-[11px] text-[#f2ca50] border border-white/5">
                        {currentLead.coldEmail.version}
                      </span>
                    </div>
                    <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
                      Tone: {currentLead.coldEmail.tone} • {wordCount} words • Estimated read time:{' '}
                      {currentLead.coldEmail.estimatedReadTime}
                    </span>
                  </div>
                </div>

                {/* Version / Regenerate Controls */}
                <div className="flex items-center gap-1 bg-[#0a0e16] p-1 rounded-lg border border-white/5">
                  <button
                    id="variant-crew-btn"
                    onClick={() => handleVariantSwitch('crew')}
                    className={`px-3 py-1 rounded font-['Hanken_Grotesk'] text-[11px] transition-colors ${
                      activeVariant === 'crew'
                        ? 'bg-[#31353e] text-[#f2ca50] font-semibold'
                        : 'text-[#d0c5af] hover:text-[#dfe2ee]'
                    }`}
                  >
                    CrewAI Draft
                  </button>
                  <button
                    id="variant-direct-btn"
                    onClick={() => handleVariantSwitch('direct')}
                    className={`px-3 py-1 rounded font-['Hanken_Grotesk'] text-[11px] transition-colors ${
                      activeVariant === 'direct'
                        ? 'bg-[#31353e] text-[#f2ca50] font-semibold'
                        : 'text-[#d0c5af] hover:text-[#dfe2ee]'
                    }`}
                  >
                    Direct Hook
                  </button>
                </div>
              </div>

              {/* Subject Line Field */}
              <div className="flex flex-col gap-1">
                <label className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] font-medium">
                  Subject Line
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email-subject-input"
                    className="w-full bg-[#0a0e16] px-4 py-2 pr-9 rounded-lg font-['Hanken_Grotesk'] text-[14px] text-[#dfe2ee] font-semibold focus:outline-none focus:ring-1 focus:ring-[#f2ca50] shadow-inner border border-white/5"
                    type="text"
                    value={subjectInput}
                    onChange={handleSubjectChange}
                  />
                  <span className="absolute right-3 text-[#d0c5af]">
                    <Edit3 className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Rich Typography Email Body Editor */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] font-medium">
                    Email Content (Click to edit text)
                  </label>
                  <span
                    id="word-count-badge"
                    className="font-['Hanken_Grotesk'] text-[12px] text-[#bcc7de]"
                  >
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  id="email-body-textarea"
                  className="w-full bg-[#0a0e16] p-4 rounded-lg font-['Hanken_Grotesk'] text-[14px] text-[#dfe2ee] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#f2ca50] shadow-inner resize-y tracking-normal font-normal border border-white/5 min-h-[220px]"
                  rows={10}
                  value={bodyInput}
                  onChange={handleBodyChange}
                />
              </div>

              {/* Quick actions: Version History */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  id="open-history-btn"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-[#1c2028] hover:bg-[#0a0e16] text-[#d0c5af] hover:text-[#f2ca50] font-['Hanken_Grotesk'] text-[11px] transition-all flex items-center gap-1 border border-white/5"
                >
                  <History className="w-3 h-3" />
                  Version History
                </button>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 mt-1 flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
                {/* Left side status/save */}
                <div className="flex items-center gap-2">
                  <button
                    id="save-draft-btn"
                    onClick={() => {
                      onUpdateDraft(currentLead.id, subjectInput, bodyInput);
                      setIsAutoSaved(true);
                      setToastMessage({
                        title: 'Draft Saved',
                        subtitle: `Draft updated for ${currentLead.companyName}`,
                      });
                      setTimeout(() => setToastMessage(null), 2000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1c2028] hover:bg-[#0a0e16] text-[#dfe2ee] font-['Hanken_Grotesk'] text-[13px] font-medium transition-colors flex items-center gap-1.5 border border-white/5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                  <span className="font-['Hanken_Grotesk'] text-[11px] text-[#58e7aa] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#58e7aa]"></span>
                    {isAutoSaved ? 'Auto-saved' : 'Saving...'}
                  </span>
                </div>

                {/* Right side: Reject or Approve & Dispatch */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Reject Button with modal intent */}
                  <button
                    id="reject-lead-btn"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#181c24] hover:bg-[#93000a]/20 text-[#ffb4ab] font-['Hanken_Grotesk'] text-[13px] font-medium transition-colors flex items-center gap-1.5 border border-[#ffb4ab]/20 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Lead</span>
                  </button>

                  {/* Approve & Queue CTA */}
                  <button
                    id="approve-dispatch-btn"
                    disabled={isApproving}
                    onClick={handleApprove}
                    className="px-6 py-2 rounded-lg bg-[#f2ca50] hover:bg-[#d4af37] text-[#3c2f00] font-['Manrope'] text-[15px] font-bold tracking-tight transition-all transform active:scale-95 shadow-md flex items-center gap-2 border border-[#ffe088]"
                  >
                    {isApproving ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Approve & Queue Dispatch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="col-span-12 lg:col-span-7 p-12 text-center bg-[#1c2028] rounded-xl border border-white/5">
            <CheckCircle2 className="w-12 h-12 text-[#58e7aa] mx-auto mb-3" />
            <h3 className="font-['Manrope'] text-xl font-bold text-[#dfe2ee]">
              Queue Completed!
            </h3>
            <p className="text-sm text-[#d0c5af] mt-1 max-w-md mx-auto">
              All leads in the queue have been reviewed and dispatched or rejected. Next batch will sync from Google Sheets automatically.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {currentLead && (
        <RejectModal
          lead={currentLead}
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirmReject={(leadId, reason) => {
            onRejectLead(leadId, reason);
            setToastMessage({
              title: 'Lead Rejected & Retrained',
              subtitle: `Logged signal for CrewAI: "${reason.slice(0, 45)}..."`,
            });
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}

      {/* Version History Modal */}
      {currentLead && (
        <VersionHistoryModal
          lead={currentLead}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div
          id="dispatch-toast"
          className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="p-4 rounded-xl bg-[#262a33] text-[#dfe2ee] shadow-2xl flex items-center gap-3.5 border-l-4 border-[#f2ca50] border border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#f2ca50] flex items-center justify-center text-[#3c2f00] font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-['Manrope'] text-[15px] font-semibold text-[#dfe2ee]">
                {toastMessage.title}
              </span>
              <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
                {toastMessage.subtitle}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
