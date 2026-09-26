import React, { useState, useEffect } from 'react';
import { Lead, FilterTab, EmailVersion } from '../types';
import {
  RotateCw,
  Search,
  CheckCircle2,
  ExternalLink,
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
  ChevronRight,
  Building2,
  Mail,
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

  const [localSearch, setLocalSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(true);
  const [dossierExpanded, setDossierExpanded] = useState(false);

  const currentLead =
    pendingLeads.find((l) => l.id === activeLeadId) || pendingLeads[0] || leads[0];

  const [subjectInput, setSubjectInput] = useState(currentLead?.coldEmail?.subject || '');
  const [bodyInput, setBodyInput] = useState(currentLead?.coldEmail?.body || '');
  const [activeVariant, setActiveVariant] = useState<'crew' | 'direct'>('crew');

  useEffect(() => {
    if (currentLead) {
      setSubjectInput(currentLead.coldEmail.subject);
      setBodyInput(currentLead.coldEmail.body);
      setActiveVariant(currentLead.coldEmail.activeVariant === 'direct' ? 'direct' : 'crew');
      setIsAutoSaved(true);
      setDossierExpanded(false);
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

  const wordCount = bodyInput.trim() ? bodyInput.trim().split(/\s+/).length : 0;

  const filteredPendingLeads = pendingLeads
    .filter((lead) => {
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
      const directSubject = `Quick question re: ${currentLead.companyName}'s ${currentLead.detectedPain.code || 'workflow'}`;
      const directBody = `Hi ${currentLead.personaName.split(' ')[0]},\n\nSaw your team is scaling fast. Most operators face efficiency bottlenecks with ${currentLead.detectedPain.code || 'reconciliation'}.\n\nOur ${currentLead.recApi || 'agent framework'} automates this workflow in minutes.\n\nWorth a quick 5-min intro this week?\n\nBest,\nAlex Mercer`;
      setSubjectInput(directSubject);
      setBodyInput(directBody);
      onUpdateDraft(currentLead.id, directSubject, directBody);
    } else {
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
        title: 'Email Dispatched',
        subtitle: `Sent to ${contactName} (${leadName}) via Gmail`,
      });
      setTimeout(() => setToastMessage(null), 3500);
    }, 700);
  };

  const handleRestoreVersion = (version: EmailVersion) => {
    setSubjectInput(version.subject);
    setBodyInput(version.body);
    if (currentLead) {
      onUpdateDraft(currentLead.id, version.subject, version.body);
    }
  };

  const reviewedCount = leads.filter((l) => l.status !== 'pending').length;
  const reviewedPct = leads.length > 0 ? Math.round((reviewedCount / leads.length) * 100) : 0;

  return (
    <div id="queue-view-container" className="flex flex-col w-full pb-8 pt-2">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[18px] font-bold text-[var(--c-text)] tracking-tight">
              AI Email Approval
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold tabular-nums">
              {pendingLeads.length} pending
            </span>
          </div>
          <p className="text-[11px] text-[var(--c-text-subtle)] mt-0.5">
            Review CrewAI-generated outreach drafts before dispatch via Gmail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="text-[var(--c-text-subtle)]">Reviewed</span>
            <div className="w-20 h-1 bg-[var(--c-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${reviewedPct}%` }}
              />
            </div>
            <span className="font-mono font-semibold text-[var(--c-text-muted)] tabular-nums">{reviewedPct}%</span>
          </div>

          {/* Sync */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--c-bg-card)] border border-[var(--c-border)] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[var(--c-text-muted)] font-medium hidden sm:inline">Sheets Inbound</span>
            <button
              onClick={onRefreshSync}
              disabled={isSyncing}
              className="text-[var(--c-text-subtle)] hover:text-[var(--c-text)] transition-colors p-0.5 cursor-pointer disabled:opacity-50"
              title="Sync latest"
            >
              <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[var(--c-amber)]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {(
          [
            { key: 'all', label: `All (${pendingLeads.length})` },
            { key: 'high-score', label: `≥90% fit (${pendingLeads.filter((l) => l.matchScore >= 90).length})` },
            { key: 'fintech', label: 'Fintech & SaaS' },
            { key: 'supply-chain', label: 'Supply Chain' },
          ] as { key: FilterTab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterTab(key)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterTab === key
                ? 'bg-[var(--c-amber)] text-[var(--c-accent-on)] font-semibold'
                : 'bg-[var(--c-bg-card)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] border border-[var(--c-border)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* LEFT: Queue List */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-2">
          {/* Search + Sort */}
          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex-1">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-text-subtle)]" />
              <input
                className="w-full bg-[var(--c-bg-card)] pl-7 pr-3 py-1.5 rounded-md text-[11px] text-[var(--c-text)] placeholder:text-[var(--c-text-subtle)] border border-[var(--c-border)] focus:outline-none focus:border-[var(--c-amber)] transition-colors"
                placeholder="Filter queue..."
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="text-[11px] text-[var(--c-text-muted)] hover:text-[var(--c-text)] px-2 py-1.5 rounded-md border border-[var(--c-border)] bg-[var(--c-bg-card)] shrink-0 cursor-pointer transition-colors"
              title="Toggle sort order"
            >
              Fit {sortDesc ? '↓' : '↑'}
            </button>
          </div>

          {/* Queue rows */}
          <div className="flex flex-col gap-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-0.5">
            {filteredPendingLeads.length === 0 ? (
              <div className="p-6 text-center bg-[var(--c-bg-card)] rounded-lg border border-[var(--c-border)] text-[var(--c-text-subtle)]">
                <CheckCircle className="w-5 h-5 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-[11px] font-semibold text-[var(--c-text)]">All caught up!</p>
                <p className="text-[10px] mt-0.5">Switch filter or sync Google Sheets.</p>
              </div>
            ) : (
              filteredPendingLeads.map((lead) => {
                const isSelected = lead.id === currentLead?.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setActiveLeadId(lead.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--c-bg-card)] border-amber-500/40 ring-1 ring-amber-500/15'
                        : 'bg-[var(--c-bg-card)] border-[var(--c-border)] hover:border-[var(--c-border-hover)] hover:bg-[var(--c-hover-bg)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSelected && (
                            <ChevronRight className="w-3 h-3 text-[var(--c-amber)] shrink-0" />
                          )}
                          <span className="font-semibold text-[11px] text-[var(--c-text)] truncate">
                            {lead.companyName}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--c-text-subtle)] truncate block mt-0.5">
                          {lead.personaName}
                          {lead.personaTitle ? ` · ${lead.personaTitle}` : ''}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 tabular-nums ${
                          lead.matchScore >= 90
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-[var(--c-bg-subtle)] text-[var(--c-text-subtle)] border border-[var(--c-border)]'
                        }`}
                      >
                        {lead.matchScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--c-border)]/40 text-[10px] text-[var(--c-text-subtle)]">
                      <span className="truncate max-w-[140px]">{lead.recApi || 'Direct Outreach'}</span>
                      {lead.domain && <span className="font-mono">{lead.domain}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT: Composer Panel */}
        {currentLead ? (
          <section className="col-span-12 lg:col-span-8 flex flex-col gap-3">
            {/* Account Header Strip */}
            <div className="p-3 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[var(--c-text-muted)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Manrope'] text-[14px] font-bold text-[var(--c-text)]">
                      {currentLead.companyName}
                    </span>
                    {currentLead.domain && (
                      <a
                        href={`https://${currentLead.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-[var(--c-text-subtle)] hover:text-[var(--c-amber)] flex items-center gap-0.5 transition-colors"
                      >
                        {currentLead.domain}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {currentLead.fundingStage && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-muted)] border border-[var(--c-border)]">
                        {currentLead.fundingStage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--c-text-subtle)] mt-0.5">
                    <Mail className="w-2.5 h-2.5" />
                    <span className="font-medium text-[var(--c-text-muted)]">{currentLead.personaName}</span>
                    {currentLead.personaTitle && <span>· {currentLead.personaTitle}</span>}
                    {currentLead.personaEmail && <span className="hidden lg:inline truncate max-w-[200px]">· {currentLead.personaEmail}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[9px] text-[var(--c-text-subtle)] uppercase font-semibold block tracking-wider">
                    Match Fit
                  </span>
                  <span className="font-['Manrope'] text-[16px] font-bold text-[var(--c-amber)] leading-tight tabular-nums">
                    {currentLead.matchScore}%
                  </span>
                </div>
                <button
                  onClick={() => setDossierExpanded((v) => !v)}
                  className="text-[10px] text-[var(--c-text-subtle)] hover:text-[var(--c-text)] px-2 py-1 rounded border border-[var(--c-border)] bg-[var(--c-bg-subtle)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Bot className="w-3 h-3" />
                  {dossierExpanded ? 'Hide' : 'Intel'}
                </button>
              </div>
            </div>

            {/* Collapsible Intelligence Dossier */}
            {dossierExpanded && (
              <div className="rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] overflow-hidden">
                {currentLead.companySummary && (
                  <div className="px-3 py-2 border-b border-[var(--c-border)] text-[11px] text-[var(--c-text-muted)] leading-relaxed">
                    {currentLead.companySummary}
                  </div>
                )}
                <div className="grid grid-cols-3 divide-x divide-[var(--c-border)]">
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Pain
                    </span>
                    <span className="text-[10px] font-mono text-[var(--c-text-subtle)]">
                      {currentLead.detectedPain.code}
                    </span>
                    <p className="text-[11px] text-[var(--c-text)] leading-snug">
                      {currentLead.detectedPain.description}
                    </p>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-[var(--c-amber)] uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Solution
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold">
                      {currentLead.recommendedPitch.fitLevel}
                    </span>
                    <p className="text-[11px] text-[var(--c-text)] leading-snug">
                      {currentLead.recommendedPitch.description}
                    </p>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" /> Signal
                    </span>
                    <span className="text-[10px] text-[var(--c-text-subtle)]">
                      {currentLead.crewAiSignal.source}
                    </span>
                    <p className="text-[11px] text-[var(--c-text)] leading-snug">
                      {currentLead.crewAiSignal.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Composer */}
            <div className="rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] flex flex-col overflow-hidden">
              {/* Composer Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-[var(--c-amber)]" />
                  <span className="text-[12px] font-semibold text-[var(--c-text)]">Cold Email Draft</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-bg-card)] text-[var(--c-text-subtle)] border border-[var(--c-border)] font-mono">
                    {currentLead.coldEmail.version}
                  </span>
                </div>

                {/* Variant Switcher */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--c-bg-card)] border border-[var(--c-border)]">
                  {(['crew', 'direct'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => handleVariantSwitch(v)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        activeVariant === v
                          ? 'bg-[var(--c-bg-subtle)] text-[var(--c-amber)] font-semibold'
                          : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
                      }`}
                    >
                      {v === 'crew' ? 'CrewAI' : 'Direct'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 flex flex-col gap-3">
                {/* Subject */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={handleSubjectChange}
                    className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-3 py-1.5 text-[11px] text-[var(--c-text)] font-medium focus:outline-none focus:border-[var(--c-amber)] transition-colors"
                  />
                </div>

                {/* Body */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
                      Body
                    </label>
                    <span className="text-[10px] text-[var(--c-text-subtle)] font-mono tabular-nums">{wordCount}w</span>
                  </div>
                  <textarea
                    rows={9}
                    value={bodyInput}
                    onChange={handleBodyChange}
                    className="w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md p-3 text-[11px] text-[var(--c-text)] font-sans leading-relaxed focus:outline-none focus:border-[var(--c-amber)] resize-y transition-colors"
                  />
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--c-border)]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--c-text-subtle)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
                    >
                      <History className="w-3 h-3" />
                      History
                    </button>
                    <button
                      onClick={() => {
                        onUpdateDraft(currentLead.id, subjectInput, bodyInput);
                        setIsAutoSaved(true);
                        setToastMessage({
                          title: 'Draft Saved',
                          subtitle: `Updated for ${currentLead.companyName}`,
                        });
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--c-text-subtle)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <span className={`text-[10px] flex items-center gap-1 ${isAutoSaved ? 'text-emerald-500' : 'text-[var(--c-text-subtle)]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaved ? 'bg-emerald-500' : 'bg-[var(--c-text-subtle)]'}`} />
                      {isAutoSaved ? 'Saved' : 'Saving…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 text-[11px] font-medium border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[var(--c-amber)] hover:bg-[var(--c-accent-hover)] text-[var(--c-accent-on)] text-[11px] font-bold transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isApproving ? (
                        <>
                          <RotateCw className="w-3 h-3 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Approve & Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="col-span-12 lg:col-span-8 p-8 text-center bg-[var(--c-bg-card)] rounded-lg border border-[var(--c-border)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-[var(--c-text)]">Queue Completed!</h3>
            <p className="text-[11px] text-[var(--c-text-muted)] mt-1">
              All leads have been processed.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {currentLead && (
        <RejectModal
          lead={currentLead}
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirmReject={(leadId, reason) => {
            onRejectLead(leadId, reason);
            setToastMessage({
              title: 'Lead Rejected',
              subtitle: 'Logged retraining signal for CrewAI',
            });
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}

      {currentLead && (
        <VersionHistoryModal
          lead={currentLead}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-2.5 rounded-lg bg-[var(--c-bg-card)] text-[var(--c-text)] shadow-lg flex items-center gap-3 border border-[var(--c-border)] border-l-4 border-l-[var(--c-amber)]">
            <div className="w-5 h-5 rounded-full bg-[var(--c-amber)] text-[var(--c-accent-on)] flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-[var(--c-text)]">{toastMessage.title}</span>
              <span className="text-[10px] text-[var(--c-text-muted)]">{toastMessage.subtitle}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
