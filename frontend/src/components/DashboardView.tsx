import React, { useEffect, useState } from 'react';
import { fetchDashboard, DashboardData, DashboardActionItem, DashboardActivity } from '../services/api';
import { NavTab } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onActionClick: (leadId: string) => void;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function _pct(numerator: number, denominator: number): string {
  if (!denominator) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function _fmt(ts: string): string {
  if (!ts) return '';
  try {
    const d = new Date(ts.replace(' UTC', 'Z'));
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

// Activity icon + colours keyed by type
const ACTIVITY_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  email_sent:       { icon: 'forward_to_inbox', bg: 'bg-[#58e7aa]/20',  color: 'text-[#58e7aa]' },
  reply_received:   { icon: 'mark_email_read',  bg: 'bg-[#f2ca50]/20',  color: 'text-[#f2ca50]' },
  lead_classified:  { icon: 'psychology',        bg: 'bg-[#93c5fd]/20',  color: 'text-[#93c5fd]' },
  followup_sent:    { icon: 'send',              bg: 'bg-[#58e7aa]/20',  color: 'text-[#58e7aa]' },
  default:          { icon: 'info',              bg: 'bg-[#262a33]',     color: 'text-[#d0c5af]'  },
};

// Category badge styles
const CAT_BADGE: Record<string, string> = {
  INTERESTED:      'bg-[#f2ca50]/15 border border-[#f2ca50]/30 text-[#f2ca50]',
  NEEDS_INFO:      'bg-[#31353e] text-[#f2ca50]',
  FOLLOW_UP_LATER: 'bg-[#93c5fd]/15 border border-[#93c5fd]/30 text-[#93c5fd]',
  PENDING:         'bg-[#f2ca50]/15 border border-[#f2ca50]/30 text-[#f2ca50]',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  label, value, icon, iconColor = 'text-[#d0c5af]/60',
  highlight = false, sub,
}: {
  label: string;
  value: number;
  icon: string;
  iconColor?: string;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors
      ${highlight
        ? 'bg-[#181c24] border border-[#f2ca50]/50 shadow-md'
        : 'bg-[#181c24] border border-[#31353e]/40 hover:border-[#31353e]'
      }`}
    >
      {highlight && (
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#f2ca50]/15 blur-xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between">
        <span className={`font-['Hanken_Grotesk'] text-[11px] uppercase tracking-wider font-medium ${highlight ? 'text-[#f2ca50]' : 'text-[#d0c5af]'}`}>
          {label}
        </span>
        <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
      </div>
      <div className="my-1">
        <span className={`font-['Manrope'] text-[40px] leading-none font-semibold ${highlight ? 'text-[#f2ca50]' : 'text-[#dfe2ee]'}`}>
          {value}
        </span>
      </div>
      {sub && (
        <div className="pt-1">
          <span className={`font-['Hanken_Grotesk'] text-[12px] ${highlight ? 'text-[#58e7aa] font-semibold' : 'text-[#d0c5af]'}`}>
            {sub}
          </span>
        </div>
      )}
      {/* Sparkline decoration */}
      <svg className={`w-full h-4 mt-2 stroke-current fill-none ${highlight ? 'text-[#f2ca50]' : 'text-[#d0c5af]/30'}`}
        preserveAspectRatio="none" viewBox="0 0 100 20">
        <path d="M0,16 Q25,14 50,10 T80,6 T100,3" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function FunnelStage({
  num, label, value, sub, pct, barColor, highlight = false,
}: {
  num: string; label: string; value: number; sub: string;
  pct: number; barColor: string; highlight?: boolean;
}) {
  return (
    <div className={`relative p-3 rounded-lg flex flex-col justify-between transition-all
      ${highlight
        ? 'bg-[#262a33] border border-[#f2ca50]/60 shadow-md'
        : 'bg-[#1c2028] border border-[#31353e]/30 hover:bg-[#262a33]'
      }`}
    >
      {highlight && <div className="absolute inset-0 bg-[#f2ca50]/5 rounded-lg pointer-events-none" />}
      <div>
        <div className="flex items-center justify-between font-['Hanken_Grotesk'] text-[11px]">
          <span className={highlight ? 'text-[#f2ca50] font-bold flex items-center gap-1.5' : 'text-[#d0c5af]'}>
            {highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] animate-pulse" />}
            {num}
          </span>
          <span className={`font-semibold ${highlight ? 'text-[#f2ca50] font-bold' : 'text-[#58e7aa]'}`}>
            {pct > 0 ? `${pct}%` : ''}
          </span>
        </div>
        <div className={`mt-1 font-['Manrope'] text-[20px] font-semibold ${highlight ? 'text-[#f2ca50]' : 'text-[#dfe2ee]'}`}>
          {value}
        </div>
        <div className={`font-['Hanken_Grotesk'] text-[12px] ${highlight ? 'text-[#dfe2ee]' : 'text-[#d0c5af]'}`}>
          {label}
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-[#31353e] rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className={`mt-1.5 font-['Hanken_Grotesk'] text-[12px] ${highlight ? 'text-[#e9c349]' : 'text-[#d0c5af]/70'}`}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onActionClick }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const d = await fetchDashboard();
      setData(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#f2ca50] border-t-transparent animate-spin" />
          <span className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-xl bg-[#181c24] border border-white/5">
          <span className="text-3xl">⚠️</span>
          <h2 className="font-['Manrope'] text-[20px] font-bold text-[#dfe2ee]">Unable to load dashboard</h2>
          <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af]">{error}</p>
          <button
            onClick={() => load()}
            className="px-5 py-2 rounded-lg bg-[#f2ca50] text-[#3c2f00] font-bold text-sm hover:bg-[#d4af37] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpis, funnel, reply_breakdown, followup_breakdown, recent_activity, action_required } = data;

  // Funnel percentages relative to total_leads
  const total = kpis.total_leads || 1;
  const funnelPct = (n: number) => Math.round((n / total) * 100);

  // Reply total for percentage bars
  const replyTotal = Object.values(reply_breakdown).reduce((a, b) => a + b, 0) || 1;

  // Reply bar config
  const replyBars: Array<{ key: keyof typeof reply_breakdown; label: string; color: string; badge?: string }> = [
    { key: 'INTERESTED',      label: 'Interested',            color: 'bg-[#f2ca50]',   badge: 'High Priority' },
    { key: 'NEEDS_INFO',      label: 'Needs Information',     color: 'bg-[#e9c349]',   badge: 'Review Needed' },
    { key: 'FOLLOW_UP_LATER', label: 'Follow Up Later',       color: 'bg-[#93c5fd]',   badge: 'Auto Cadence' },
    { key: 'NOT_INTERESTED',  label: 'Not Interested',        color: 'bg-[#99907c]' },
    { key: 'BOUNCE',          label: 'Hard Bounce / Invalid', color: 'bg-[#ffb4ab]/60' },
    { key: 'UNCLEAR',         label: 'Ambiguous / Unclear',   color: 'bg-[#4d4635]' },
  ];

  return (
    <div className="flex flex-col w-full pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-['Hanken_Grotesk'] text-[11px] uppercase tracking-wider text-[#f2ca50] font-semibold">
              Executive Command Console
            </span>
            <span className="text-[#d0c5af]/40">•</span>
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#58e7aa] font-medium">
              Live Telemetry
            </span>
          </div>
          <h1 className="font-['Manrope'] text-[28px] leading-[36px] font-semibold text-[#dfe2ee] tracking-tight">
            Pipeline &amp; Performance Dashboard
          </h1>
          <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af] max-w-2xl">
            Real-time visibility into AI outreach efficiency, conversion funnel velocities, and autonomous agent orchestration.
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181c24] hover:bg-[#262a33] border border-[#31353e]/40 transition-colors"
        >
          <span className={`material-symbols-outlined text-[#58e7aa] text-sm ${refreshing ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
            {refreshing ? <span className="text-[#58e7aa] font-medium">Refreshing...</span> : 'Refresh data'}
          </span>
        </button>
      </div>

      {/* 1. KPI ROW */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Leads"      value={kpis.total_leads}      icon="group"             sub="All time" />
        <KpiCard label="AI Processed"     value={kpis.ai_processed}     icon="psychology"        iconColor="text-[#f2ca50]"  sub={`${_pct(kpis.ai_processed, kpis.total_leads)} of total`} />
        <KpiCard label="Emails Sent"      value={kpis.emails_sent}      icon="forward_to_inbox"  sub={`${_pct(kpis.emails_sent, kpis.ai_processed)} of processed`} />
        <KpiCard label="Replies Received" value={kpis.replies_received} icon="mark_email_read"   iconColor="text-[#58e7aa]"  sub={`${_pct(kpis.replies_received, kpis.emails_sent)} reply rate`} />
        <KpiCard label="Interested Leads" value={kpis.interested_leads} icon="stars"             iconColor="text-[#f2ca50]"  highlight sub={`${_pct(kpis.interested_leads, kpis.replies_received)} of replies`} />
        <KpiCard label="Follow-ups Pending" value={kpis.followups_pending} icon="schedule"       sub="Need sign-off" />
      </section>

      {/* 2. FUNNEL */}
      <section className="mt-6 rounded-xl bg-[#181c24] border border-[#31353e]/40 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#262a33] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#f2ca50] text-base">filter_alt</span>
            </div>
            <div>
              <h2 className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee]">
                End-to-End Conversion Funnel
              </h2>
              <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
                Step-by-step pipeline drop-off metrics
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <FunnelStage num="01 / Ingestion"    label="Total Inbound"         value={funnel.leads}        pct={100}                              sub="All leads"        barColor="bg-[#bcc7de]" />
          <FunnelStage num="02 / Evaluated"    label="Enriched & Scored"     value={funnel.ai_processed} pct={funnelPct(funnel.ai_processed)}   sub="AI pipeline"      barColor="bg-[#bcc7de]" />
          <FunnelStage num="03 / Dispatched"   label="Cold Email Sent"       value={funnel.emails_sent}  pct={funnelPct(funnel.emails_sent)}    sub="Via Gmail"        barColor="bg-[#bcc7de]" />
          <FunnelStage num="04 / Inbound Reply" label="Direct Replies"       value={funnel.replies}      pct={funnelPct(funnel.replies)}        sub="From prospects"   barColor="bg-[#f2ca50]/80" />
          <FunnelStage num="05 / High Interest" label="Positive Sentiment"   value={funnel.interested}   pct={funnelPct(funnel.interested)}     sub="INTERESTED only"  barColor="bg-[#f2ca50]"    highlight />
          <FunnelStage num="06 / Follow-ups"   label="In Cadence"            value={funnel.followups}    pct={funnelPct(funnel.followups)}      sub="Active follow-up" barColor="bg-[#33ca90]" />
        </div>
      </section>

      {/* 3. REPLY INTELLIGENCE + FOLLOW-UP STATUS */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Reply Intelligence (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#181c24] border border-[#31353e]/40 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#58e7aa]" />
                <h3 className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee]">
                  Reply Intelligence &amp; Sentiment
                </h3>
              </div>
              <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af] mt-0.5">
                AI classification across {replyTotal} inbound prospect replies
              </p>
            </div>
            <span className="font-['Hanken_Grotesk'] text-[12px] px-2 py-0.5 rounded bg-[#262a33] text-[#d0c5af] font-semibold border border-[#31353e]">
              {replyTotal} Total
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {replyBars.map(({ key, label, color, badge }) => {
              const count = reply_breakdown[key];
              const pct = Math.round((count / replyTotal) * 100);
              return (
                <div key={key} className="flex flex-col gap-1 p-1 rounded-lg hover:bg-[#1c2028] transition-colors">
                  <div className="flex items-center justify-between font-['Hanken_Grotesk'] text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-[#dfe2ee] font-medium">{label}</span>
                      {badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 text-[#f2ca50] font-['Hanken_Grotesk'] text-[11px] font-semibold">
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-['Hanken_Grotesk'] text-[12px]">
                      <span className="text-[#dfe2ee] font-semibold">{count}</span>
                      <span className="text-[#d0c5af] w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#31353e] h-2 rounded-full overflow-hidden">
                    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          {replyTotal === 0 && (
            <p className="mt-4 font-['Hanken_Grotesk'] text-[12px] text-[#99907c] text-center">
              No replies classified yet. Check for replies in the Approved tab.
            </p>
          )}
        </div>

        {/* Follow-up Status (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#181c24] border border-[#31353e]/40 p-6 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f2ca50] text-base">alt_route</span>
                <h3 className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee]">
                  Follow-Up Status
                </h3>
              </div>
              <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af] mt-0.5">
                Follow-up orchestrations in pipeline
              </p>
            </div>
            <span className="font-['Hanken_Grotesk'] text-[12px] px-2 py-0.5 rounded bg-[#262a33] text-[#f2ca50] font-semibold border border-[#31353e]">
              {Object.values(followup_breakdown).reduce((a, b) => a + b, 0)} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 flex-1">
            {/* Pending */}
            <div className="p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d0c5af]">
                <span className="font-['Hanken_Grotesk'] text-[11px] uppercase font-semibold">Pending Review</span>
                <span className="material-symbols-outlined text-[#f2ca50] text-sm">notification_important</span>
              </div>
              <div className="my-1 font-['Manrope'] text-[24px] font-bold text-[#f2ca50]">
                {followup_breakdown.PENDING}
              </div>
              <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">Urgent sign-off</span>
            </div>

            {/* Sent */}
            <div className="p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d0c5af]">
                <span className="font-['Hanken_Grotesk'] text-[11px] uppercase font-semibold">Sent</span>
                <span className="material-symbols-outlined text-[#58e7aa] text-sm">schedule_send</span>
              </div>
              <div className="my-1 font-['Manrope'] text-[24px] font-bold text-[#dfe2ee]">
                {followup_breakdown.SENT}
              </div>
              <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">Delivered</span>
            </div>

            {/* Approved */}
            <div className="p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d0c5af]">
                <span className="font-['Hanken_Grotesk'] text-[11px] uppercase font-semibold">Approved</span>
                <span className="material-symbols-outlined text-[#bcc7de] text-sm">done_all</span>
              </div>
              <div className="my-1 font-['Manrope'] text-[24px] font-bold text-[#dfe2ee]">
                {followup_breakdown.APPROVED}
              </div>
              <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">Approved</span>
            </div>

            {/* Cancelled */}
            <div className="p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d0c5af]">
                <span className="font-['Hanken_Grotesk'] text-[11px] uppercase font-semibold">Cancelled</span>
                <span className="material-symbols-outlined text-[#d0c5af] text-sm">remove_done</span>
              </div>
              <div className="my-1 font-['Manrope'] text-[24px] font-bold text-[#d0c5af]">
                {followup_breakdown.CANCELLED}
              </div>
              <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">Cancelled</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVITY + ACTION REQUIRED */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#181c24] border border-[#31353e]/40 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse" />
              <h3 className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee]">
                Real-Time CRM Activity
              </h3>
            </div>
            <div className="flex items-center gap-1.5 font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af]">
              <span className="material-symbols-outlined text-sm">history</span>
              <span>Latest 20 events</span>
            </div>
          </div>

          {recent_activity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="font-['Hanken_Grotesk'] text-[13px] text-[#99907c]">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {recent_activity.map((act: DashboardActivity, i: number) => {
                const cfg = ACTIVITY_CONFIG[act.type] ?? ACTIVITY_CONFIG.default;
                return (
                  <div key={`${act.lead_id}-${i}`}
                    className="p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/20 flex items-start gap-3 hover:bg-[#262a33] transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-['Manrope'] text-[14px] font-semibold text-[#dfe2ee] truncate">
                          {act.company}{act.contact ? ` · ${act.contact}` : ''}
                        </span>
                        <span className="font-['Hanken_Grotesk'] text-[11px] text-[#d0c5af] shrink-0">
                          {_fmt(act.timestamp)}
                        </span>
                      </div>
                      <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af] mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Required (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#181c24] border border-[#31353e]/40 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f2ca50] text-base">priority_high</span>
              <h3 className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee]">Action Required</h3>
            </div>
            {action_required.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#f2ca50]/15 border border-[#f2ca50]/30 text-[#f2ca50] font-['Hanken_Grotesk'] text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] animate-ping" />
                {action_required.length} Pending
              </span>
            )}
          </div>

          {action_required.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
              <span className="material-symbols-outlined text-[#58e7aa] text-4xl">check_circle</span>
              <p className="font-['Hanken_Grotesk'] text-[13px] text-[#d0c5af]">All caught up — no actions needed.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {action_required.slice(0, 5).map((item: DashboardActionItem) => {
                const badgeClass = CAT_BADGE[item.category ?? ''] ?? 'bg-[#31353e] text-[#d0c5af]';
                return (
                  <button
                    key={item.lead_id}
                    onClick={() => onActionClick(item.lead_id)}
                    className="w-full text-left p-3 rounded-lg bg-[#1c2028] border border-[#31353e]/40 flex flex-col gap-2 hover:bg-[#262a33] hover:border-[#f2ca50]/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-['Manrope'] text-[14px] font-semibold text-[#dfe2ee] group-hover:text-[#f2ca50] transition-colors">
                          {item.company}
                        </h4>
                        {item.contact && (
                          <div className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">{item.contact}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.category && (
                          <span className={`px-2 py-0.5 rounded-full font-['Hanken_Grotesk'] text-[11px] font-semibold ${badgeClass}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[14px] text-[#d0c5af]/40 group-hover:text-[#f2ca50] transition-colors">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                    <p className="font-['Hanken_Grotesk'] text-[12px] text-[#dfe2ee]/90">
                      {item.reason}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-[#31353e]/30">
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
              {action_required.length > 5 ? `Showing 5 of ${action_required.length}` : `${action_required.length} item${action_required.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => onNavigate('approved')}
              className="font-['Hanken_Grotesk'] text-[12px] text-[#f2ca50] hover:underline flex items-center gap-0.5"
            >
              <span>View Approved Queue</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
