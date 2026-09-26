import React, { useEffect, useState } from 'react';
import { fetchDashboard, DashboardData, DashboardActionItem, DashboardActivity } from '../services/api';
import { NavTab } from '../types';
import {
  Users,
  Bot,
  Send,
  MailCheck,
  Sparkles,
  Clock,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Flame,
  HelpCircle,
  Calendar,
  UserX,
  XCircle,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onActionClick: (leadId: string) => void;
}

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
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

// Activity config with lucide icons
const ACTIVITY_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  email_sent: {
    icon: <Send className="w-3.5 h-3.5" />,
    bg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    text: 'text-emerald-500',
  },
  reply_received: {
    icon: <MailCheck className="w-3.5 h-3.5" />,
    bg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    text: 'text-amber-500',
  },
  lead_classified: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    text: 'text-blue-500',
  },
  followup_sent: {
    icon: <Calendar className="w-3.5 h-3.5" />,
    bg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    text: 'text-emerald-500',
  },
  default: {
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    text: 'text-slate-400',
  },
};

// Category badge styles
const CAT_BADGE: Record<string, { badgeClass: string; icon: React.ReactNode }> = {
  INTERESTED: {
    badgeClass: 'crm-badge-green font-semibold',
    icon: <Flame className="w-3 h-3 text-emerald-500" />,
  },
  NEEDS_INFO: {
    badgeClass: 'crm-badge-amber font-semibold',
    icon: <HelpCircle className="w-3 h-3 text-amber-500" />,
  },
  FOLLOW_UP_LATER: {
    badgeClass: 'crm-badge-blue font-semibold',
    icon: <Calendar className="w-3 h-3 text-blue-500" />,
  },
  NOT_INTERESTED: {
    badgeClass: 'crm-badge-neutral text-slate-400',
    icon: <UserX className="w-3 h-3 text-slate-400" />,
  },
  BOUNCE: {
    badgeClass: 'crm-badge-red text-rose-500',
    icon: <XCircle className="w-3 h-3 text-rose-500" />,
  },
};

// Compact KPI Card
function CompactKpiCard({
  label,
  value,
  icon,
  highlight = false,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
        highlight
          ? 'bg-[var(--c-bg-card)] border-amber-500/30 shadow-xs'
          : 'bg-[var(--c-bg-card)] border-[var(--c-border)] hover:border-[var(--c-border-hover)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--c-text-muted)] tracking-wider uppercase">
          {label}
        </span>
        <span className={highlight ? 'text-[var(--c-amber)]' : 'text-[var(--c-text-subtle)]'}>
          {icon}
        </span>
      </div>
      <div className="my-1.5 flex items-baseline justify-between">
        <span className="font-['Manrope'] text-[24px] font-bold text-[var(--c-text)] leading-none">
          {value}
        </span>
      </div>
      {sub && (
        <span className={`text-[11px] truncate ${highlight ? 'text-[var(--c-amber)] font-medium' : 'text-[var(--c-text-subtle)]'}`}>
          {sub}
        </span>
      )}
    </div>
  );
}

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

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--c-amber)] border-t-transparent animate-spin" />
          <span className="text-[13px] text-[var(--c-text-muted)]">Loading metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center p-6 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)]">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <h2 className="font-['Manrope'] text-[16px] font-semibold text-[var(--c-text)]">
            Unable to load dashboard
          </h2>
          <p className="text-[12px] text-[var(--c-text-muted)]">{error}</p>
          <button
            onClick={() => load()}
            className="px-3.5 py-1.5 rounded-md bg-[var(--c-amber)] text-[var(--c-accent-on)] font-semibold text-xs hover:bg-[var(--c-accent-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpis, funnel, reply_breakdown, followup_breakdown, recent_activity, action_required } = data;
  const total = kpis.total_leads || 1;
  const funnelPct = (n: number) => Math.round((n / total) * 100);
  const replyTotal = Object.values(reply_breakdown).reduce((a, b) => a + b, 0) || 1;

  const replyBars: Array<{
    key: keyof typeof reply_breakdown;
    label: string;
    color: string;
    dotBg: string;
    badge?: string;
  }> = [
    { key: 'INTERESTED', label: 'Interested', color: 'bg-emerald-500', dotBg: 'bg-emerald-500', badge: 'High Priority' },
    { key: 'NEEDS_INFO', label: 'Needs Information', color: 'bg-amber-500', dotBg: 'bg-amber-500', badge: 'Review Needed' },
    { key: 'FOLLOW_UP_LATER', label: 'Follow Up Later', color: 'bg-blue-500', dotBg: 'bg-blue-500', badge: 'Cadence' },
    { key: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-slate-400', dotBg: 'bg-slate-400' },
    { key: 'BOUNCE', label: 'Bounce / Invalid', color: 'bg-rose-400', dotBg: 'bg-rose-400' },
    { key: 'UNCLEAR', label: 'Ambiguous / Unclear', color: 'bg-slate-600', dotBg: 'bg-slate-600' },
  ];

  const funnelSteps = [
    { num: '01', label: 'Total Inbound', value: funnel.leads, pct: 100, sub: 'All leads' },
    { num: '02', label: 'AI Processed', value: funnel.ai_processed, pct: funnelPct(funnel.ai_processed), sub: 'Enriched' },
    { num: '03', label: 'Cold Emails Sent', value: funnel.emails_sent, pct: funnelPct(funnel.emails_sent), sub: 'Via Gmail' },
    { num: '04', label: 'Replies Received', value: funnel.replies, pct: funnelPct(funnel.replies), sub: 'Prospect replies' },
    { num: '05', label: 'Positive Interest', value: funnel.interested, pct: funnelPct(funnel.interested), sub: 'Interested', highlight: true },
    { num: '06', label: 'In Follow-up', value: funnel.followups, pct: funnelPct(funnel.followups), sub: 'Cadence' },
  ];

  return (
    <div className="flex flex-col w-full pb-8 pt-2">
      {/* PAGE HEADER */}
      <div className="flex flex-row items-center justify-between gap-4 py-4 border-b border-[var(--c-border)] mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[20px] font-bold text-[var(--c-text)]">
              Pipeline Overview
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-[var(--c-text-subtle)] font-medium">Live Telemetry</span>
          </div>
          <p className="text-[12px] text-[var(--c-text-muted)] mt-0.5">
            Real-time performance metrics across CrewAI outreach, email delivery, and response conversion.
          </p>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--c-bg-card)] hover:bg-[var(--c-hover-bg)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] border border-[var(--c-border)] transition-colors text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--c-amber)]' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 1. COMPACT KPI ROW (6 CARDS) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <CompactKpiCard
          label="Total Leads"
          value={kpis.total_leads}
          icon={<Users className="w-4 h-4" />}
          sub="All indexed leads"
        />
        <CompactKpiCard
          label="AI Processed"
          value={kpis.ai_processed}
          icon={<Bot className="w-4 h-4" />}
          sub={`${_pct(kpis.ai_processed, kpis.total_leads)} completed`}
        />
        <CompactKpiCard
          label="Emails Sent"
          value={kpis.emails_sent}
          icon={<Send className="w-4 h-4" />}
          sub={`${_pct(kpis.emails_sent, kpis.ai_processed)} dispatch rate`}
        />
        <CompactKpiCard
          label="Replies"
          value={kpis.replies_received}
          icon={<MailCheck className="w-4 h-4" />}
          sub={`${_pct(kpis.replies_received, kpis.emails_sent)} reply rate`}
        />
        <CompactKpiCard
          label="Interested"
          value={kpis.interested_leads}
          icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
          highlight={true}
          sub={`${_pct(kpis.interested_leads, kpis.replies_received)} positive`}
        />
        <CompactKpiCard
          label="Follow-ups"
          value={kpis.followups_pending}
          icon={<Clock className="w-4 h-4" />}
          sub="Pending review"
        />
      </section>

      {/* 2. PIPELINE CONVERSION FUNNEL */}
      <section className="mt-4 p-4 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--c-amber)]" />
            <h2 className="font-['Manrope'] text-[14px] font-semibold text-[var(--c-text)]">
              End-to-End Outreach Funnel
            </h2>
          </div>
          <span className="text-[11px] text-[var(--c-text-subtle)]">
            Step-by-step conversion tracking
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {funnelSteps.map((step) => (
            <div
              key={step.num}
              className={`p-2.5 rounded-md border flex flex-col justify-between transition-colors ${
                step.highlight
                  ? 'bg-[var(--c-amber-bg)]/30 border-amber-500/30'
                  : 'bg-[var(--c-bg-subtle)] border-[var(--c-border)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--c-text-subtle)] font-medium">{step.num}</span>
                  <span className={`font-semibold ${step.highlight ? 'text-[var(--c-amber)]' : 'text-emerald-500'}`}>
                    {step.pct}%
                  </span>
                </div>
                <div className="mt-1 font-['Manrope'] text-[18px] font-bold text-[var(--c-text)] leading-none">
                  {step.value}
                </div>
                <div className="text-[11px] font-medium text-[var(--c-text)] mt-1 truncate">
                  {step.label}
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-[var(--c-border)] h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.highlight ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(step.pct, 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-[var(--c-text-subtle)] truncate">
                  {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. REPLY SENTIMENT + FOLLOW-UP STATUS */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Reply Intelligence (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="font-['Manrope'] text-[14px] font-semibold text-[var(--c-text)]">
                Inbound Reply Sentiment
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--c-hover-bg)] text-[var(--c-text-muted)] font-medium border border-[var(--c-border)]">
              {replyTotal} Total Replies
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {replyBars.map(({ key, label, color, dotBg, badge }) => {
              const count = reply_breakdown[key];
              const pct = Math.round((count / replyTotal) * 100);
              return (
                <div
                  key={key}
                  className="p-1.5 px-2 rounded-md hover:bg-[var(--c-hover-bg)] transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotBg}`} />
                      <span className="font-medium text-[var(--c-text)]">{label}</span>
                      {badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[var(--c-hover-bg)] text-[var(--c-text-muted)] border border-[var(--c-border)]">
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[var(--c-text)]">{count}</span>
                      <span className="text-[var(--c-text-subtle)] w-8 text-right font-mono text-[11px]">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--c-border)] h-1 rounded-full overflow-hidden">
                    <div className={`${color} h-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow-up Status (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h3 className="font-['Manrope'] text-[14px] font-semibold text-[var(--c-text)]">
                Follow-Up Orchestration
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--c-hover-bg)] text-[var(--c-text-muted)] font-medium border border-[var(--c-border)]">
              {Object.values(followup_breakdown).reduce((a, b) => a + b, 0)} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="p-3 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">
                Pending Review
              </span>
              <div className="my-1 font-['Manrope'] text-[20px] font-bold text-[var(--c-amber)]">
                {followup_breakdown.PENDING}
              </div>
              <span className="text-[11px] text-[var(--c-text-subtle)]">Awaiting sign-off</span>
            </div>

            <div className="p-3 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">
                Delivered
              </span>
              <div className="my-1 font-['Manrope'] text-[20px] font-bold text-emerald-500">
                {followup_breakdown.SENT}
              </div>
              <span className="text-[11px] text-[var(--c-text-subtle)]">Sent to prospect</span>
            </div>

            <div className="p-3 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">
                Approved
              </span>
              <div className="my-1 font-['Manrope'] text-[20px] font-bold text-[var(--c-text)]">
                {followup_breakdown.APPROVED}
              </div>
              <span className="text-[11px] text-[var(--c-text-subtle)]">Ready in queue</span>
            </div>

            <div className="p-3 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">
                Cancelled
              </span>
              <div className="my-1 font-['Manrope'] text-[20px] font-bold text-[var(--c-text-subtle)]">
                {followup_breakdown.CANCELLED}
              </div>
              <span className="text-[11px] text-[var(--c-text-subtle)]">Dismissed</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVITY LOG & ACTION REQUIRED */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--c-text-muted)]" />
              <h3 className="font-['Manrope'] text-[14px] font-semibold text-[var(--c-text)]">
                Recent CRM Events
              </h3>
            </div>
            <span className="text-[11px] text-[var(--c-text-subtle)]">Latest 20 entries</span>
          </div>

          {recent_activity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs text-[var(--c-text-muted)]">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 max-h-72 overflow-y-auto pr-1">
              {recent_activity.map((act: DashboardActivity, i: number) => {
                const cfg = ACTIVITY_CONFIG[act.type] ?? ACTIVITY_CONFIG.default;
                return (
                  <div
                    key={`${act.lead_id}-${i}`}
                    className="p-2 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] flex items-start gap-2.5 hover:bg-[var(--c-hover-bg)] transition-colors"
                  >
                    <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0 mt-0.5`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-xs text-[var(--c-text)] truncate">
                          {act.company}
                          {act.contact ? ` · ${act.contact}` : ''}
                        </span>
                        <span className="text-[10px] text-[var(--c-text-subtle)] shrink-0 font-mono">
                          {_fmt(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--c-text-muted)] mt-0.5 line-clamp-1">
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
        <div className="lg:col-span-5 p-4 rounded-lg bg-[var(--c-bg-card)] border border-[var(--c-border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-['Manrope'] text-[14px] font-semibold text-[var(--c-text)]">
                Action Required
              </h3>
            </div>
            {action_required.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {action_required.length} Pending
              </span>
            )}
          </div>

          {action_required.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <p className="text-xs text-[var(--c-text-muted)]">All caught up — no actions needed.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {action_required.slice(0, 4).map((item: DashboardActionItem) => {
                const badgeCfg = CAT_BADGE[item.category ?? ''] ?? {
                  badgeClass: 'crm-badge-neutral',
                  icon: null,
                };
                return (
                  <button
                    key={item.lead_id}
                    onClick={() => onActionClick(item.lead_id)}
                    className="w-full text-left p-2.5 rounded-md bg-[var(--c-bg-subtle)] border border-[var(--c-border)] hover:border-[var(--c-amber)]/40 hover:bg-[var(--c-hover-bg)] flex flex-col gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-[var(--c-text)] group-hover:text-[var(--c-amber)] transition-colors truncate block">
                          {item.company}
                        </span>
                        {item.contact && (
                          <span className="text-[11px] text-[var(--c-text-subtle)]">{item.contact}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.category && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeCfg.badgeClass}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--c-text-subtle)] group-hover:text-[var(--c-amber)] transition-colors" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--c-text-muted)] line-clamp-1">
                      {item.reason}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-[var(--c-border)] text-xs">
            <span className="text-[11px] text-[var(--c-text-subtle)]">
              {action_required.length > 4 ? `Showing 4 of ${action_required.length}` : `${action_required.length} pending`}
            </span>
            <button
              onClick={() => onNavigate('approved')}
              className="text-[11px] font-semibold text-[var(--c-amber)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Approved Queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
