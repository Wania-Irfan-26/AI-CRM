import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Lead } from '../types';

interface RejectModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (leadId: string, reason: string) => void;
}

const REASONS = [
  'Wrong persona — no purchasing authority',
  'Irrelevant pain point / poor API fit',
  'Bad contact email or outdated tenure',
  'Company in hiring freeze or downsized',
  'Competitor or existing vendor relationship',
];

export const RejectModal: React.FC<RejectModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirmReject,
}) => {
  const [selectedReason, setSelectedReason] = useState(REASONS[1]);
  const [customFeedback, setCustomFeedback] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const fullReason = customFeedback.trim()
      ? `${selectedReason} — ${customFeedback.trim()}`
      : selectedReason;
    onConfirmReject(lead.id, fullReason);
    onClose();
  };

  return (
    <div
      id="reject-lead-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        id="reject-lead-modal-content"
        className="bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-xl max-w-md w-full shadow-xl flex flex-col gap-0 relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-['Manrope'] text-[13px] font-bold text-[var(--c-text)]">
                Reject & Log Signal
              </h3>
              <p className="text-[10px] text-[var(--c-text-subtle)]">
                {lead.companyName} · {lead.personaName}
              </p>
            </div>
          </div>
          <button
            id="close-reject-modal-btn"
            onClick={onClose}
            className="text-[var(--c-text-subtle)] hover:text-[var(--c-text)] p-1 rounded-md hover:bg-[var(--c-hover-bg)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Info notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] text-[11px] text-[var(--c-text-muted)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              This rejection feeds CrewAI heuristics to improve ICP scoring and reduce similar
              unqualified leads in future batches.
            </span>
          </div>

          {/* Reason selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
              Rejection Reason
            </label>
            <div className="flex flex-col gap-1">
              {REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition-colors text-[12px] ${
                    selectedReason === reason
                      ? 'border-[var(--c-amber)] bg-[var(--c-active-bg)] text-[var(--c-text)]'
                      : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-muted)] hover:bg-[var(--c-hover-bg)] hover:text-[var(--c-text)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-[var(--c-amber)] shrink-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional context */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[var(--c-text-subtle)] uppercase tracking-wider">
              Additional Context <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="reject-context-notes"
              rows={2}
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="e.g. Recently moved to proprietary API; check back in Q2..."
              className="w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-3 py-2 text-[11px] text-[var(--c-text)] placeholder:text-[var(--c-text-subtle)] focus:outline-none focus:border-[var(--c-amber)] transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
          <button
            id="cancel-reject-modal-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[var(--c-bg)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] text-[11px] font-medium hover:bg-[var(--c-hover-bg)] transition-colors border border-[var(--c-border)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-reject-lead-btn"
            onClick={handleConfirm}
            className="px-3.5 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
