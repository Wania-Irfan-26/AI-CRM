import React, { useState } from 'react';
import { Bot, Database, AlertTriangle, Check, ChevronRight } from 'lucide-react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div className="flex items-start justify-between gap-6 py-3 border-b border-[var(--c-border)] last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-semibold text-[var(--c-text)]">{label}</p>
      {description && (
        <p className="text-[11px] text-[var(--c-text-subtle)] mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
    <div className="shrink-0 flex items-center">{children}</div>
  </div>
);

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, children }) => (
  <div className="bg-[var(--c-bg-card)] border border-[var(--c-border)] rounded-lg overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--c-border)] bg-[var(--c-bg-subtle)]">
      <span className="text-[var(--c-amber)]">{icon}</span>
      <h2 className="font-['Manrope'] text-[12px] font-bold text-[var(--c-text)] uppercase tracking-wider">
        {title}
      </h2>
    </div>
    <div className="px-4">{children}</div>
  </div>
);

const selectClass =
  'bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-2.5 py-1.5 text-[11px] text-[var(--c-text)] focus:outline-none focus:border-[var(--c-amber)] transition-colors min-w-[180px] cursor-pointer';

const inputClass =
  'bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-2.5 py-1.5 text-[11px] text-[var(--c-text)] focus:outline-none focus:border-[var(--c-amber)] transition-colors w-[220px]';

const readonlyInputClass =
  'bg-[var(--c-bg-subtle)] border border-[var(--c-border)] rounded-md px-2.5 py-1.5 text-[11px] text-[var(--c-text-muted)] cursor-not-allowed w-[220px]';

export const SettingsView: React.FC = () => {
  const [minMatchScore, setMinMatchScore] = useState(80);
  const [syncInterval, setSyncInterval] = useState('5');
  const [defaultTone, setDefaultTone] = useState('Executive Consultative');
  const [modelName] = useState('gemini-2.5-flash / CrewAI Orchestrator v3');

  return (
    <div id="settings-view" className="flex flex-col w-full pb-8 pt-2 max-w-3xl">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] mb-6">
        <div>
          <h1 className="font-['Manrope'] text-[18px] font-bold text-[var(--c-text)] tracking-tight">
            Settings
          </h1>
          <p className="text-[11px] text-[var(--c-text-subtle)] mt-0.5">
            Configure CrewAI orchestration, scoring thresholds, and data pipeline behavior.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* AI Orchestration */}
        <Section icon={<Bot className="w-3.5 h-3.5" />} title="AI Orchestration">
          <SettingRow
            label="AI Engine"
            description="CrewAI orchestration model used for lead enrichment and email generation."
          >
            <input
              type="text"
              value={modelName}
              readOnly
              className={readonlyInputClass}
              title="Model is configured server-side"
            />
          </SettingRow>

          <SettingRow
            label={`Minimum Match Score — ${minMatchScore}%`}
            description="Leads below this threshold are excluded from the approval queue."
          >
            <div className="flex items-center gap-3 min-w-[180px]">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="accent-[var(--c-amber)] cursor-pointer flex-1"
              />
              <span className="text-[11px] font-semibold text-[var(--c-amber)] tabular-nums w-8 text-right">
                {minMatchScore}%
              </span>
            </div>
          </SettingRow>

          <SettingRow
            label="Default Email Tone"
            description="Applied to all CrewAI-generated cold email drafts."
          >
            <select
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              className={selectClass}
            >
              <option value="Executive Consultative">Executive Consultative</option>
              <option value="Direct Outreach">Direct & Concise</option>
              <option value="Technical Rigor">Technical Rigor</option>
              <option value="Clinical Rigor">Clinical Rigor</option>
            </select>
          </SettingRow>
        </Section>

        {/* Data Pipeline */}
        <Section icon={<Database className="w-3.5 h-3.5" />} title="Data Pipeline">
          <SettingRow
            label="Connected Spreadsheet"
            description="Google Sheets source for prospect ingestion. Configured server-side."
          >
            <input
              type="text"
              readOnly
              value="Q3 Enterprise Inbound v2"
              className={readonlyInputClass}
            />
          </SettingRow>

          <SettingRow
            label="Sync Cadence"
            description="How often the CRM polls Google Sheets for new prospect rows."
          >
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className={selectClass}
            >
              <option value="1">Every 1 minute (Realtime)</option>
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="60">Hourly batch</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Bidirectional Write-back"
            description="Approval timestamps and dispatch IDs are written back to Sheets."
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <Check className="w-3 h-3" /> Active
            </span>
          </SettingRow>
        </Section>

        {/* System Info */}
        <Section icon={<ChevronRight className="w-3.5 h-3.5" />} title="System">
          <SettingRow label="Backend URL" description="FastAPI endpoint serving this CRM.">
            <span className="font-mono text-[11px] text-[var(--c-text-muted)] bg-[var(--c-bg-subtle)] border border-[var(--c-border)] px-2.5 py-1.5 rounded-md">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </span>
          </SettingRow>
          <SettingRow label="Frontend Version" description="Current CRM build.">
            <span className="text-[11px] font-mono text-[var(--c-text-subtle)]">11B-4</span>
          </SettingRow>
        </Section>

        {/* Notice */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--c-text-muted)] leading-relaxed">
            Settings changes are not persisted to the backend yet. Values reset on page reload.
            Backend integration is planned in a future release.
          </p>
        </div>
      </div>
    </div>
  );
};
