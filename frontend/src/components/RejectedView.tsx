import React, { useState } from 'react';
import { Lead } from '../types';
import { XCircle, RefreshCw, Search, Clock, MessageSquare } from 'lucide-react';

interface RejectedViewProps {
  rejectedLeads: Lead[];
  onReconsiderLead: (leadId: string) => void;
}

export const RejectedView: React.FC<RejectedViewProps> = ({
  rejectedLeads,
  onReconsiderLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = rejectedLeads.filter((lead) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      lead.companyName.toLowerCase().includes(q) ||
      lead.personaName.toLowerCase().includes(q) ||
      lead.domain.toLowerCase().includes(q) ||
      (lead.rejectionReason || '').toLowerCase().includes(q)
    );
  });

  return (
    <div id="rejected-leads-view" className="flex flex-col w-full pb-8 pt-2">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[18px] font-bold text-[var(--c-text)] tracking-tight">
              Rejected Leads
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold tabular-nums">
              {rejectedLeads.length}
            </span>
          </div>
          <p className="text-[11px] text-[var(--c-text-subtle)] mt-0.5">
            Rejection signals tune CrewAI persona heuristics and ICP score thresholds.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-48">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-text-subtle)]" />
          <input
            type="text"
            placeholder="Search rejected..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-md pl-7 pr-3 py-1.5 text-[11px] text-[var(--c-text)] placeholder:text-[var(--c-text-subtle)] focus:outline-none focus:border-[var(--c-amber)] transition-colors"
          />
        </div>
      </div>

      {/* Retraining notice — compact info bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--c-bg-card)] border border-[var(--c-border)] mb-4 text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span className="text-[var(--c-text-muted)]">
          Negative feedback loop active — rejections suppress similar titles, employee bands,
          and mismatched pain codes.
        </span>
        <span className="ml-auto font-semibold text-[var(--c-amber)] shrink-0">+4.8% precision this week</span>
      </div>

      {/* Rejection rows */}
      {rejectedLeads.length === 0 ? (
        <div className="p-8 text-center bg-[var(--c-bg-card)] rounded-lg border border-[var(--c-border)] text-[var(--c-text-subtle)]">
          <p className="text-[11px]">No rejected leads on record.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center bg-[var(--c-bg-card)] rounded-lg border border-[var(--c-border)] text-[var(--c-text-subtle)]">
          <p className="text-[11px]">No leads match the search.</p>
        </div>
      ) : (
        <div className="bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-lg overflow-hidden">
          <div className="divide-y divide-[var(--c-border)]">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--c-hover-bg)] transition-colors group"
              >
                {/* Status icon */}
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                </div>

                {/* Company + persona */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[11px] text-[var(--c-text)] truncate">
                      {lead.companyName}
                    </span>
                    {lead.domain && (
                      <span className="text-[9px] font-mono text-[var(--c-text-subtle)]">
                        {lead.domain}
                      </span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-subtle)] border border-[var(--c-border)] font-medium tabular-nums">
                      {lead.matchScore}% fit
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-subtle)] border border-[var(--c-border)]">
                      {lead.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--c-text-subtle)] mt-0.5 flex-wrap">
                    <span className="font-medium text-[var(--c-text-muted)]">{lead.personaName}</span>
                    {lead.personaTitle && <span>· {lead.personaTitle}</span>}
                    {lead.rejectionReason && (
                      <span className="flex items-center gap-1 text-rose-400 hidden sm:flex">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {lead.rejectionReason}
                      </span>
                    )}
                  </div>
                  {/* Mobile rejection reason */}
                  {lead.rejectionReason && (
                    <div className="sm:hidden text-[10px] text-rose-400 mt-0.5 flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {lead.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Timestamp / action */}
                <div className="flex items-center gap-2 shrink-0">
                  {lead.timeAgo && (
                    <span className="hidden md:flex items-center gap-1 text-[9px] text-[var(--c-text-subtle)]">
                      <Clock className="w-2.5 h-2.5" />
                      {lead.timeAgo}
                    </span>
                  )}
                  <button
                    onClick={() => onReconsiderLead(lead.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-[var(--c-text-muted)] hover:text-[var(--c-text)] bg-[var(--c-bg-subtle)] hover:bg-[var(--c-hover-bg)] border border-[var(--c-border)] transition-colors cursor-pointer"
                    title="Reconsider and return to queue"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Reconsider
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[var(--c-border)] bg-[var(--c-bg-subtle)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--c-text-subtle)]">
              {filtered.length} of {rejectedLeads.length} rejections
            </span>
            <span className="text-[10px] text-[var(--c-text-subtle)]">
              Signals logged to CrewAI retraining pipeline
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
