import React from 'react';
import { X, History, RotateCcw, Check } from 'lucide-react';
import { Lead, EmailVersion } from '../types';

interface VersionHistoryModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (version: EmailVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  lead,
  isOpen,
  onClose,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  const versions: EmailVersion[] =
    lead.coldEmail.versions && lead.coldEmail.versions.length > 0
      ? lead.coldEmail.versions
      : [
          {
            id: 'current',
            label: `${lead.coldEmail.version} (Active)`,
            subject: lead.coldEmail.subject,
            body: lead.coldEmail.body,
            tone: lead.coldEmail.tone,
            words: lead.coldEmail.body.split(/\s+/).filter(Boolean).length,
            timestamp: 'Just now',
          },
        ];

  return (
    <div
      id="version-history-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="version-history-modal-content"
        className="bg-[#1c2028] border border-white/10 rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f2ca50]/20 text-[#f2ca50] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Manrope'] text-[18px] font-bold text-[#dfe2ee]">
                Email Draft Version History
              </h3>
              <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
                {lead.companyName} • {lead.personaName}
              </p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            onClick={onClose}
            className="text-[#d0c5af] hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex flex-col gap-3 max-h-[60vh]">
          {versions.map((v, i) => {
            const isCurrent = v.body.trim() === lead.coldEmail.body.trim();
            return (
              <div
                key={v.id || i}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-[#f2ca50]/40 bg-[#262a33]'
                    : 'border-white/5 bg-[#181c24] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-['Hanken_Grotesk'] text-[13px] font-bold text-[#dfe2ee]">
                      {v.label}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#31353e] text-[#d0c5af]">
                      {v.tone}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2ca50]/20 text-[#f2ca50] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#99907c]">{v.timestamp}</span>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onRestoreVersion(v);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-[#31353e] hover:bg-[#f2ca50] hover:text-[#3c2f00] text-xs font-semibold text-[#dfe2ee] transition-all flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] text-[#d0c5af] font-medium">Subject: </span>
                  <span className="text-[12px] text-[#dfe2ee] font-semibold">{v.subject}</span>
                </div>

                <div className="p-2.5 rounded bg-[#0a0e16] text-[12px] text-[#d0c5af] font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {v.body}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            id="close-history-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#262a33] text-xs text-[#dfe2ee] hover:bg-[#31353e]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
