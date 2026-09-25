import React, { useState } from 'react';
import { Lead, NavTab } from '../types';
import { Search, Filter, ExternalLink, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  onSelectLeadForReview: (leadId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSelectLeadForReview,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = [
    'All',
    'Supply Chain & Logistics',
    'Fintech & SaaS',
    'Healthcare & Bio',
    'Energy AI',
    'Retail & E-commerce',
  ];

  const filtered = leads.filter((lead) => {
    if (categoryFilter !== 'All' && lead.category !== categoryFilter) return false;
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
  });

  return (
    <div id="leads-directory-view" className="flex flex-col gap-6 py-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-['Manrope'] text-[28px] font-bold text-[#dfe2ee]">
            Enterprise Leads Directory
          </h1>
          <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
            Ingested from Google Sheets & CrewAI intelligence scrapers ({leads.length} accounts indexed).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#d0c5af]" />
            <input
              type="text"
              placeholder="Search companies, contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#181c24] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#dfe2ee] placeholder:text-[#d0c5af]/60 focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-['Hanken_Grotesk'] text-xs transition-all ${
              categoryFilter === cat
                ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
                : 'bg-[#181c24] text-[#d0c5af] hover:text-[#dfe2ee] border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-[#181c24] border border-white/5 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0e16] text-[#d0c5af] uppercase tracking-wider font-semibold border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Company & Domain</th>
                <th className="py-3 px-4">Contact Persona</th>
                <th className="py-3 px-4">Target API Solution</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-['Hanken_Grotesk']">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#1c2028] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[#dfe2ee]">
                        {lead.companyName}
                      </span>
                      <span className="text-[11px] text-[#bcc7de] flex items-center gap-1">
                        {lead.domain}
                        <a
                          href={`https://${lead.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[#f2ca50]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#dfe2ee]">{lead.personaName}</span>
                      <span className="text-[#99907c] text-[11px]">{lead.personaTitle}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-[#262a33] text-[#f2ca50] font-medium border border-white/5">
                      {lead.recApi}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        lead.matchScore >= 90 ? 'text-[#f2ca50]' : 'text-[#bcc7de]'
                      }`}
                    >
                      {lead.matchScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {lead.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f2ca50]/15 text-[#f2ca50] text-[11px] font-semibold border border-[#f2ca50]/20">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    )}
                    {lead.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#58e7aa]/15 text-[#58e7aa] text-[11px] font-semibold border border-[#58e7aa]/20">
                        <CheckCircle className="w-3 h-3" /> Dispatched
                      </span>
                    )}
                    {lead.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[11px] font-semibold border border-[#ffb4ab]/20">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {lead.status === 'pending' ? (
                      <button
                        onClick={() => {
                          onSelectLeadForReview(lead.id);
                          setActiveTab('ai-emails');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#31353e] hover:bg-[#f2ca50] hover:text-[#3c2f00] text-[#dfe2ee] font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
                      >
                        Review Draft <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectLeadForReview(lead.id);
                          setActiveTab('ai-emails');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#d0c5af] hover:text-[#dfe2ee] transition-all inline-flex items-center gap-1"
                      >
                        View Dossier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
