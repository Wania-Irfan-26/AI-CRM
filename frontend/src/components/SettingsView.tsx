import React, { useState } from 'react';
import { Sliders, Database, Bot, AlertTriangle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [minMatchScore, setMinMatchScore] = useState(80);
  const [syncInterval, setSyncInterval] = useState('5');
  const [defaultTone, setDefaultTone] = useState('Executive Consultative');
  const [modelName, setModelName] = useState('gemini-2.5-flash / CrewAI Orchestrator v3');

  return (
    <div id="settings-view" className="flex flex-col gap-6 py-6 max-w-4xl pb-12">
      <div>
        <h1 className="font-['Manrope'] text-[28px] font-bold text-[#dfe2ee]">
          Vanguard AI & Pipeline Settings
        </h1>
        <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
          Configure CrewAI orchestration behavior, scoring thresholds, and Google Sheets bidirectional sync.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CrewAI Engine Config */}
        <div className="p-5 rounded-xl bg-[#181c24] border border-white/5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Bot className="w-5 h-5 text-[#f2ca50]" />
            <h3 className="font-['Manrope'] text-base font-bold text-[#dfe2ee]">
              CrewAI Orchestration Model
            </h3>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#d0c5af]">AI Engine / Model</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="bg-[#0a0e16] border border-white/10 rounded-lg p-2 text-xs text-[#dfe2ee] focus:outline-none focus:border-[#f2ca50]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#d0c5af]">
              Minimum Match Score for Approval Queue: <span className="text-[#f2ca50] font-bold">{minMatchScore}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="accent-[#f2ca50] cursor-pointer"
            />
            <span className="text-[11px] text-[#99907c]">
              Leads scoring below this threshold are routed to automated nurture or discarded.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#d0c5af]">Default Cold Email Tone</label>
            <select
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              className="bg-[#0a0e16] border border-white/10 rounded-lg p-2 text-xs text-[#dfe2ee] focus:outline-none focus:border-[#f2ca50]"
            >
              <option value="Executive Consultative">Executive Consultative (Recommended)</option>
              <option value="Direct Outreach">Direct Outreach & Concise</option>
              <option value="Technical Rigor">Technical Rigor (Engineers & Architects)</option>
              <option value="Clinical Rigor">Clinical Rigor (Healthcare & Pharma)</option>
            </select>
          </div>
        </div>

        {/* Google Sheets Bidirectional Sync */}
        <div className="p-5 rounded-xl bg-[#181c24] border border-white/5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <Database className="w-5 h-5 text-[#58e7aa]" />
            <h3 className="font-['Manrope'] text-base font-bold text-[#dfe2ee]">
              Google Sheets Live Sync
            </h3>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#d0c5af]">Connected Spreadsheet</label>
            <input
              type="text"
              readOnly
              value="Q3 Enterprise Inbound v2 (12,480 rows)"
              className="bg-[#0a0e16] border border-white/10 rounded-lg p-2 text-xs text-[#dfe2ee] opacity-80 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#d0c5af]">Sync Cadence</label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className="bg-[#0a0e16] border border-white/10 rounded-lg p-2 text-xs text-[#dfe2ee] focus:outline-none focus:border-[#f2ca50]"
            >
              <option value="1">Every 1 minute (Realtime Webhook)</option>
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="60">Hourly batch</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-[#1c2028] border border-white/5 text-xs text-[#d0c5af] flex flex-col gap-1">
            <span className="font-semibold text-[#dfe2ee]">Bidirectional Telemetry:</span>
            <span>• Reads new prospect rows & enriched pain points</span>
            <span>• Writes back executive approval timestamp & dispatched sequence ID</span>
          </div>
        </div>
      </div>

      {/* Not connected notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#1c2028] border border-[#f2ca50]/20">
        <AlertTriangle className="w-4 h-4 text-[#f2ca50] shrink-0 mt-0.5" />
        <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af] leading-relaxed">
          Settings are not yet connected to the backend. Changes made here are not saved and will reset on page reload. Backend integration will be wired up in a future step.
        </p>
      </div>
    </div>
  );
};
