import React from 'react';
import { Lead } from '../types';
import { XCircle, ShieldAlert, Cpu, RefreshCw } from 'lucide-react';

interface RejectedViewProps {
  rejectedLeads: Lead[];
  onReconsiderLead: (leadId: string) => void;
}

export const RejectedView: React.FC<RejectedViewProps> = ({
  rejectedLeads,
  onReconsiderLead,
}) => {
  return (
    <div id="rejected-leads-view" className="flex flex-col gap-6 py-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[28px] font-bold text-[#dfe2ee]">
              Rejected Leads & Agent Retraining Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] font-['Hanken_Grotesk'] text-xs font-semibold border border-[#ffb4ab]/20">
              {rejectedLeads.length} Rejections Logged
            </span>
          </div>
          <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
            Rejection signals directly tune CrewAI persona heuristics and company ICP score thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181c24] border border-white/5 text-xs text-[#d0c5af]">
          <Cpu className="w-4 h-4 text-[#f2ca50]" />
          <span>Heuristic Weight Updates: Active</span>
        </div>
      </div>

      {/* Retraining Signals Summary */}
      <div className="p-4 rounded-xl bg-[#262a33] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#93000a]/30 text-[#ffb4ab] flex items-center justify-center border border-[#ffb4ab]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-['Manrope'] text-sm font-bold text-[#dfe2ee]">
              Active CrewAI Negative Feedback Loop
            </h4>
            <p className="text-xs text-[#d0c5af]">
              Each confirmed rejection suppresses similar titles, lower employee bands, or mismatched pain points from entering the approval queue.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-[#f2ca50] bg-[#1c2028] px-3 py-1.5 rounded-lg border border-white/5">
          Confidence Model Precision: +4.8% this week
        </div>
      </div>

      {/* List of Rejected Leads */}
      <div className="flex flex-col gap-3">
        {rejectedLeads.length === 0 ? (
          <div className="p-10 text-center bg-[#181c24] rounded-xl border border-white/5 text-[#d0c5af]">
            <p>No rejected leads recorded.</p>
          </div>
        ) : (
          rejectedLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-5 rounded-xl bg-[#181c24] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center shrink-0 border border-[#ffb4ab]/30">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Manrope'] text-base font-bold text-[#dfe2ee]">
                      {lead.companyName}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-[#0a0e16] font-mono text-[11px] text-[#bcc7de] border border-white/5">
                      {lead.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#31353e] text-[#bcc7de] text-[11px] font-medium">
                      Score: {lead.matchScore}%
                    </span>
                  </div>
                  <p className="text-xs text-[#d0c5af] mt-0.5">
                    Contact: <span className="text-[#dfe2ee]">{lead.personaName}</span> (
                    {lead.personaTitle}) • {lead.personaEmail}
                  </p>
                  <div className="mt-2 p-2 rounded bg-[#0a0e16] text-xs border border-white/5 max-w-xl">
                    <span className="text-[#ffb4ab] font-semibold">Logged Signal: </span>
                    <span className="text-[#dfe2ee]">
                      {lead.rejectionReason || 'Irrelevant core pain point'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onReconsiderLead(lead.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-xs font-semibold text-[#dfe2ee] transition-all flex items-center gap-1.5 border border-white/5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#f2ca50]" />
                  Reconsider & Return to Queue
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
