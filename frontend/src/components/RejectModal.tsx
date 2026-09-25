import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Lead } from '../types';

interface RejectModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (leadId: string, reason: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirmReject,
}) => {
  const [selectedReason, setSelectedReason] = useState('Irrelevant core pain point');
  const [customFeedback, setCustomFeedback] = useState('');

  if (!isOpen) return null;

  const reasons = [
    'Wrong persona authority (No purchasing budget)',
    'Irrelevant core pain point / poor API fit',
    'Bad contact email / outdated tenure',
    'Company in hiring freeze or downsized',
    'Competitor or existing relationship',
  ];

  const handleConfirm = () => {
    const fullReason = customFeedback.trim()
      ? `${selectedReason} — Note: ${customFeedback.trim()}`
      : selectedReason;
    onConfirmReject(lead.id, fullReason);
    onClose();
  };

  return (
    <div
      id="reject-lead-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="reject-lead-modal-content"
        className="bg-[#1c2028] border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#93000a]/30 text-[#ffb4ab] flex items-center justify-center border border-[#ffb4ab]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Manrope'] text-[18px] font-bold text-[#dfe2ee]">
                Reject Lead & Retrain Agent
              </h3>
              <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af]">
                For <span className="text-[#dfe2ee] font-medium">{lead.companyName}</span> ({lead.personaName})
              </p>
            </div>
          </div>
          <button
            id="close-reject-modal-btn"
            onClick={onClose}
            className="text-[#d0c5af] hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#262a33] text-xs text-[#d0c5af] flex items-start gap-2 border border-white/5">
          <AlertTriangle className="w-4 h-4 text-[#f2ca50] shrink-0 mt-0.5" />
          <span>
            Logging this rejection feeds the CrewAI heuristic engine to adjust ICP scoring and prevent similar unqualified outreach in future batch cycles.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-['Hanken_Grotesk'] text-[12px] font-semibold text-[#d0c5af] uppercase tracking-wider">
            Select Primary Rejection Signal:
          </label>
          <div className="flex flex-col gap-1.5">
            {reasons.map((reason, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                  selectedReason === reason
                    ? 'border-[#f2ca50] bg-[#f2ca50]/10 text-[#dfe2ee]'
                    : 'border-white/5 bg-[#181c24] text-[#d0c5af] hover:bg-[#262a33]'
                }`}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-[#f2ca50]"
                />
                <span className="font-['Hanken_Grotesk'] text-[13px]">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-['Hanken_Grotesk'] text-[12px] font-semibold text-[#d0c5af]">
            Additional Context for Agent (Optional):
          </label>
          <textarea
            id="reject-context-notes"
            rows={2}
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            placeholder="e.g. Recently transitioned from EDI to proprietary REST API; check again in Q2..."
            className="w-full bg-[#181c24] border border-white/10 rounded-lg p-2.5 text-xs text-[#dfe2ee] placeholder:text-[#d0c5af]/50 focus:outline-none focus:border-[#f2ca50]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            id="cancel-reject-modal-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#262a33] text-[#d0c5af] hover:text-[#dfe2ee] text-xs font-medium hover:bg-[#31353e] transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-reject-lead-btn"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-[#93000a] text-[#ffdad6] hover:bg-[#ffb4ab] hover:text-[#690005] text-xs font-bold transition-all shadow-md"
          >
            Confirm Rejection & Retrain
          </button>
        </div>
      </div>
    </div>
  );
};
