import React, { useState } from 'react';
import { Lead, NavTab } from '../types';
import { Search, ExternalLink, ArrowRight, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  onSelectLeadForReview: (leadId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    cls: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    icon: <Clock className="w-2.5 h-2.5" />,
  },
  approved: {
    label: 'Dispatched',
    cls: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    icon: <CheckCircle className="w-2.5 h-2.5" />,
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    icon: <XCircle className="w-2.5 h-2.5" />,
  },
};

const CATEGORIES = [
  'All',
  'Supply Chain & Logistics',
  'Fintech & SaaS',
  'Healthcare & Bio',
  'Energy AI',
  'Retail & E-commerce',
];

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSelectLeadForReview,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortField, setSortField] = useState<'matchScore' | 'companyName'>('matchScore');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = leads
    .filter((lead) => {
      if (categoryFilter !== 'All' && lead.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          lead.companyName.toLowerCase().includes(q) ||
          lead.personaName.toLowerCase().includes(q) ||
          lead.domain.toLowerCase().includes(q) ||
          lead.recApi.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'matchScore') return sortDesc ? b.matchScore - a.matchScore : a.matchScore - b.matchScore;
      return sortDesc ? b.companyName.localeCompare(a.companyName) : a.companyName.localeCompare(b.companyName);
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDesc((v) => !v);
    else { setSortField(field); setSortDesc(true); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      <ChevronDown className={`w-3 h-3 inline ml-0.5 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />
    ) : null;

  const counts = {
    all: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    approved: leads.filter((l) => l.status === 'approved').length,
    rejected: leads.filter((l) => l.status === 'rejected').length,
  };

  return (
    <div id="leads-directory-view" className="flex flex-col w-full pb-8 pt-2">
      {/* PAGE HEADER */}
      <div className="flex flex-row items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[18px] font-bold text-[var(--c-text)] tracking-tight">
              Leads Directory
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-subtle)] border border-[var(--c-border)] font-medium tabular-nums">
              {leads.length}
            </span>
          </div>
          <p className="text-[11px] text-[var(--c-text-subtle)] mt-0.5">
            Full account directory — enriched by CrewAI, sourced from Google Sheets.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-text-subtle)]" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-md pl-8 pr-3 py-1.5 text-xs text-[var(--c-text)] placeholder:text-[var(--c-text-subtle)] focus:outline-none focus:border-[var(--c-amber)] transition-colors"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[var(--c-amber)] text-[var(--c-accent-on)] font-semibold'
                  : 'bg-[var(--c-bg-card)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] border border-[var(--c-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-0 border border-[var(--c-border)] rounded-md overflow-hidden shrink-0">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer capitalize ${
                i > 0 ? 'border-l border-[var(--c-border)]' : ''
              } ${
                statusFilter === s
                  ? 'bg-[var(--c-bg-subtle)] text-[var(--c-text)] font-semibold'
                  : 'bg-[var(--c-bg-card)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover-bg)]'
              }`}
            >
              {s === 'all' ? `All · ${counts.all}` : `${s.charAt(0).toUpperCase() + s.slice(1)} · ${counts[s]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-[var(--c-border)]">
              <tr className="bg-[var(--c-bg-subtle)]">
                <th
                  className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider cursor-pointer select-none hover:text-[var(--c-text)] transition-colors"
                  onClick={() => handleSort('companyName')}
                >
                  Company <SortIcon field="companyName" />
                </th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
                  Contact
                </th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
                  Solution
                </th>
                <th
                  className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider cursor-pointer select-none hover:text-[var(--c-text)] transition-colors"
                  onClick={() => handleSort('matchScore')}
                >
                  Fit <SortIcon field="matchScore" />
                </th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[11px] text-[var(--c-text-subtle)]">
                    No leads match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const sc = STATUS_CONFIG[lead.status];
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[var(--c-hover-bg)] transition-colors group"
                    >
                      {/* Company */}
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[var(--c-text)] leading-tight">
                            {lead.companyName}
                          </span>
                          {lead.domain && (
                            <span className="text-[10px] text-[var(--c-text-subtle)] font-mono flex items-center gap-0.5 mt-0.5">
                              {lead.domain}
                              <a
                                href={`https://${lead.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[var(--c-text-subtle)] hover:text-[var(--c-amber)] ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-[var(--c-text)] leading-tight">
                            {lead.personaName}
                          </span>
                          {lead.personaTitle && (
                            <span className="text-[10px] text-[var(--c-text-subtle)] leading-tight mt-0.5 max-w-[160px] truncate">
                              {lead.personaTitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Solution */}
                      <td className="py-2 px-4">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-muted)] border border-[var(--c-border)] font-medium leading-tight inline-block">
                          {lead.recApi || 'Outreach'}
                        </span>
                      </td>

                      {/* Fit score */}
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1 rounded-full bg-[var(--c-border)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${lead.matchScore >= 90 ? 'bg-[var(--c-amber)]' : lead.matchScore >= 75 ? 'bg-blue-500' : 'bg-[var(--c-text-subtle)]'}`}
                              style={{ width: `${lead.matchScore}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-semibold tabular-nums ${lead.matchScore >= 90 ? 'text-[var(--c-amber)]' : 'text-[var(--c-text-muted)]'}`}>
                            {lead.matchScore}%
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${sc.cls}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-4 text-right">
                        {lead.status === 'pending' ? (
                          <button
                            onClick={() => {
                              onSelectLeadForReview(lead.id);
                              setActiveTab('ai-emails');
                            }}
                            className="px-2.5 py-1 rounded bg-[var(--c-amber)] hover:bg-[var(--c-accent-hover)] text-[var(--c-accent-on)] font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            Review
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectLeadForReview(lead.id);
                              setActiveTab('ai-emails');
                            }}
                            className="px-2.5 py-1 rounded bg-transparent hover:bg-[var(--c-hover-bg)] text-[var(--c-text-subtle)] hover:text-[var(--c-text)] text-[11px] font-medium border border-[var(--c-border)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            Dossier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--c-border)] bg-[var(--c-bg-subtle)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--c-text-subtle)]">
              Showing {filtered.length} of {leads.length} accounts
            </span>
            <span className="text-[10px] text-[var(--c-text-subtle)]">
              {counts.pending} pending · {counts.approved} dispatched · {counts.rejected} rejected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
