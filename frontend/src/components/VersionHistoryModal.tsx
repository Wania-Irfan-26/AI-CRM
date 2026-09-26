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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        id="version-history-modal-content"
        className="bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-xl max-w-2xl w-full shadow-xl flex flex-col gap-0 relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--c-amber-bg)] text-[var(--c-amber)] flex items-center justify-center border border-[var(--c-active-border)]">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-['Manrope'] text-[13px] font-bold text-[var(--c-text)]">
                Version History
              </h3>
              <p className="text-[10px] text-[var(--c-text-subtle)]">
                {lead.companyName} · {lead.personaName}
              </p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            onClick={onClose}
            className="text-[var(--c-text-subtle)] hover:text-[var(--c-text)] p-1 rounded-md hover:bg-[var(--c-hover-bg)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Versions list */}
        <div className="overflow-y-auto flex flex-col divide-y divide-[var(--c-border)]">
          {versions.map((v, i) => {
            const isCurrent = v.body.trim() === lead.coldEmail.body.trim();
            return (
              <div
                key={v.id || i}
                className={`p-4 transition-colors ${
                  isCurrent ? 'bg-[var(--c-active-bg)]' : 'bg-[var(--c-bg-card)] hover:bg-[var(--c-hover-bg)]'
                }`}
              >
                {/* Version header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[var(--c-text)]">{v.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-bg-subtle)] text-[var(--c-text-muted)] border border-[var(--c-border)]">
                      {v.tone}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--c-amber-bg)] text-[var(--c-amber)] border border-[var(--c-active-border)] font-semibold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--c-text-subtle)]">{v.timestamp}</span>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onRestoreVersion(v);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-md bg-[var(--c-bg-subtle)] hover:bg-[var(--c-amber)] hover:text-[var(--c-accent-on)] text-[10px] font-semibold text-[var(--c-text-muted)] transition-colors flex items-center gap-1 border border-[var(--c-border)] cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Restore
                      </button>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-2 text-[11px]">
                  <span className="text-[var(--c-text-subtle)] font-medium">Subject: </span>
                  <span className="text-[var(--c-text)] font-semibold">{v.subject}</span>
                </div>

                {/* Body preview */}
                <div className="p-2.5 rounded-md bg-[var(--c-bg)] border border-[var(--c-border)] text-[10px] text-[var(--c-text-muted)] font-mono whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                  {v.body}
                </div>

                {/* Word count */}
                <div className="mt-1.5 text-[10px] text-[var(--c-text-subtle)] tabular-nums">
                  {v.words} words
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
          <button
            id="close-history-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[var(--c-bg)] text-[11px] text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover-bg)] border border-[var(--c-border)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
