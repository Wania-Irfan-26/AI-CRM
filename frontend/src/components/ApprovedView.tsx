import React, { useState, useEffect, useRef } from 'react';
import { Lead, Reply, Classification, FollowUp } from '../types';
import {
  Send, Mail, RotateCw, MessageSquare, Clock,
  ChevronDown, ChevronUp, Calendar, CheckCircle,
  X, ExternalLink, AlertTriangle, Sparkles, Search,
  Flame, HelpCircle, UserX,
} from 'lucide-react';
import { fetchReplies, generateFollowUp, approveFollowUp, cancelFollowUp } from '../services/api';

interface ApprovedViewProps {
  approvedLeads: Lead[];
  focusLeadId?: string | null;
  onFocusHandled?: () => void;
}

interface ReplyState {
  status: 'idle' | 'checking' | 'found' | 'not_found' | 'error';
  reply?: Reply;
  error?: string;
  expanded?: boolean;
}

// Category config — uses crm-badge-* classes from index.css (CSS vars, no Tailwind arbitrary vars)
const CAT: Record<string, {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;   // crm-badge-* class
  accentClass: string;  // text-* for Tailwind standard colors
  borderClass: string;  // Tailwind standard border color
  bgClass: string;      // Tailwind standard bg tint
}> = {
  INTERESTED:      { label: 'Interested',      icon: <Flame    className="w-3 h-3" />, badgeClass: 'crm-badge-green',   accentClass: 'text-emerald-500', borderClass: 'border-emerald-500/20', bgClass: 'bg-emerald-500/5' },
  NEEDS_INFO:      { label: 'Needs Info',      icon: <HelpCircle className="w-3 h-3" />, badgeClass: 'crm-badge-amber', accentClass: 'text-amber-500',   borderClass: 'border-amber-500/20',   bgClass: 'bg-amber-500/5'   },
  FOLLOW_UP_LATER: { label: 'Follow Up Later', icon: <Calendar className="w-3 h-3" />, badgeClass: 'crm-badge-blue',   accentClass: 'text-blue-400',    borderClass: 'border-blue-500/20',    bgClass: 'bg-blue-500/5'    },
  NOT_INTERESTED:  { label: 'Not Interested',  icon: <UserX    className="w-3 h-3" />, badgeClass: 'crm-badge-neutral', accentClass: 'text-slate-400',  borderClass: 'border-slate-600/30',   bgClass: 'bg-slate-500/5'   },
  BOUNCE:          { label: 'Bounced',         icon: <AlertTriangle className="w-3 h-3" />, badgeClass: 'crm-badge-red', accentClass: 'text-rose-500', borderClass: 'border-rose-500/20',    bgClass: 'bg-rose-500/5'    },
  UNCLEAR:         { label: 'Unclear',         icon: <Sparkles className="w-3 h-3" />, badgeClass: 'crm-badge-neutral', accentClass: 'text-slate-400', borderClass: 'border-slate-600/30',  bgClass: 'bg-slate-500/5'   },
};

function _fmt(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw.replace(' UTC', 'Z'));
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return raw; }
}

// ─── Classification Panel ───────────────────────────────────────────────────
function ClassificationPanel({ c }: { c: Classification }) {
  const cfg = CAT[c.reply_category] ?? CAT['UNCLEAR'];
  return (
    <div className={`rounded border ${cfg.borderClass} ${cfg.bgClass} p-2.5`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${cfg.accentClass}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </div>
        <span className={`crm-badge text-[9px] font-bold uppercase tracking-wider ${cfg.badgeClass}`}>AI</span>
      </div>
      <p className="text-[11px] font-medium text-primary mb-1">{c.sales_action}</p>
      {c.classification_reason && (
        <p className="text-[10px] text-muted italic leading-relaxed">"{c.classification_reason}"</p>
      )}
      {c.classified_at && (
        <span className="text-[10px] text-subtle flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5" />
          {_fmt(c.classified_at)}
        </span>
      )}
    </div>
  );
}

// ─── Follow-up Panel ────────────────────────────────────────────────────────
function FollowUpPanel({ leadId, initialFollowUp }: { leadId: string; initialFollowUp: FollowUp | null | undefined }) {
  const [fu, setFu] = useState<FollowUp | null>(initialFollowUp ?? null);
  const [subject, setSubject] = useState(initialFollowUp?.follow_up_subject ?? '');
  const [body, setBody] = useState(initialFollowUp?.follow_up_body ?? '');
  const [busy, setBusy] = useState<'generating' | 'approving' | 'cancelling' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bodyOpen, setBodyOpen] = useState(false);
  const status = fu?.follow_up_status ?? null;

  const gen = async () => {
    setBusy('generating'); setErr(null);
    try {
      const d = await generateFollowUp(leadId);
      setFu(d); setSubject(d.follow_up_subject ?? ''); setBody(d.follow_up_body ?? '');
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(null); }
  };

  const approve = async () => {
    setBusy('approving'); setErr(null);
    try {
      const { sentAt } = await approveFollowUp(leadId);
      setFu((p) => p ? { ...p, follow_up_status: 'SENT', follow_up_sent_at: sentAt } : p);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(null); }
  };

  const cancel = async () => {
    setBusy('cancelling'); setErr(null);
    try {
      await cancelFollowUp(leadId);
      setFu((p) => p ? { ...p, follow_up_status: 'CANCELLED' } : p);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
          <Calendar className="w-3 h-3" />
          Follow-Up
        </div>
        {status === 'SENT'      && <span className="crm-badge crm-badge-green text-[9px] font-bold uppercase">Sent</span>}
        {status === 'CANCELLED' && <span className="crm-badge crm-badge-neutral text-[9px] font-bold uppercase">Cancelled</span>}
        {status === 'PENDING'   && <span className="crm-badge crm-badge-blue text-[9px] font-bold uppercase">Draft Ready</span>}
      </div>

      {/* No draft yet */}
      {(!status || status === 'CANCELLED') && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted flex-1">Prospect requested future contact.</p>
          <button onClick={gen} disabled={busy === 'generating'}
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-semibold border border-blue-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy === 'generating' ? <><RotateCw className="w-2.5 h-2.5 animate-spin" /> Generating…</> : <><Sparkles className="w-2.5 h-2.5" /> Generate</>}
          </button>
        </div>
      )}

      {/* Pending — editable draft */}
      {status === 'PENDING' && (
        <div className="flex flex-col gap-2">
          {fu?.follow_up_date && (
            <span className="text-[10px] text-subtle">Scheduled: <strong className="text-blue-400">{fu.follow_up_date}</strong></span>
          )}
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject" className="input-crm w-full" />
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)}
            className="input-crm w-full resize-y" />
          <div className="flex items-center gap-2">
            <button onClick={approve} disabled={!!busy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer">
              {busy === 'approving' ? <><RotateCw className="w-2.5 h-2.5 animate-spin" />Sending…</> : <><Send className="w-2.5 h-2.5" />Approve & Send</>}
            </button>
            <button onClick={cancel} disabled={!!busy}
              className="flex items-center gap-1 px-2 py-1 rounded border border-base bg-hover text-muted hover:text-red text-[10px] transition-colors disabled:opacity-50 cursor-pointer">
              <X className="w-2.5 h-2.5" /> Cancel
            </button>
          </div>
          {err && <p className="text-[10px] text-rose-500">{err}</p>}
        </div>
      )}

      {/* Sent */}
      {status === 'SENT' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle className="w-3 h-3" /> Sent via Gmail
              {fu?.follow_up_sent_at && <span className="text-subtle ml-1">{_fmt(fu.follow_up_sent_at)}</span>}
            </div>
            <button onClick={() => setBodyOpen(v => !v)}
              className="flex items-center gap-0.5 text-subtle hover:text-primary transition-colors cursor-pointer">
              {bodyOpen ? <><ChevronUp className="w-3 h-3" />Hide</> : <><ChevronDown className="w-3 h-3" />Preview</>}
            </button>
          </div>
          {fu?.follow_up_subject && <span className="text-[10px] text-muted italic">"{fu.follow_up_subject}"</span>}
          {bodyOpen && fu?.follow_up_body && (
            <div className="mt-1 p-2 rounded border border-base bg-subtle text-[10px] text-primary whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
              {fu.follow_up_body}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const ApprovedView: React.FC<ApprovedViewProps> = ({ approvedLeads, focusLeadId, onFocusHandled }) => {
  const [replyStates, setReplyStates] = useState<Record<string, ReplyState>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const leadRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setRS = (id: string, s: ReplyState) => setReplyStates(prev => ({ ...prev, [id]: s }));

  // Focus effect — auto-expand and scroll to targeted lead
  useEffect(() => {
    if (!focusLeadId) return;
    const lead = approvedLeads.find(l => l.id === focusLeadId);
    if (!lead) return;
    setRS(focusLeadId, { status: lead.reply ? 'found' : 'idle', reply: lead.reply ?? undefined, expanded: true });
    setTimeout(() => {
      leadRefs.current[focusLeadId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onFocusHandled?.();
    }, 100);
  }, [focusLeadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckReply = async (lead: Lead) => {
    const cur = replyStates[lead.id];
    if (cur?.status === 'found') { setRS(lead.id, { ...cur, expanded: !cur.expanded }); return; }
    if (lead.reply) { setRS(lead.id, { status: 'found', reply: lead.reply, expanded: true }); return; }
    setRS(lead.id, { status: 'checking' });
    try {
      const r = await fetchReplies(lead.id);
      if (r.replied && r.reply) setRS(lead.id, { status: 'found', reply: r.reply, expanded: true });
      else setRS(lead.id, { status: 'not_found' });
    } catch (e: unknown) {
      setRS(lead.id, { status: 'error', error: e instanceof Error ? e.message : 'Error' });
    }
  };

  const toggleExpand = (id: string) =>
    setReplyStates(prev => {
      const cur = prev[id];
      return cur ? { ...prev, [id]: { ...cur, expanded: !cur.expanded } } : prev;
    });

  // Stats
  const repliedCount   = approvedLeads.filter(l => l.reply).length;
  const interestedCount = approvedLeads.filter(l => l.reply?.classification?.reply_category === 'INTERESTED').length;
  const pendingFUCount  = approvedLeads.filter(l => l.followUp?.follow_up_status === 'PENDING').length;

  // Filtered list
  const filtered = approvedLeads.filter(lead => {
    if (search) {
      const q = search.toLowerCase();
      if (!lead.companyName.toLowerCase().includes(q) && !lead.personaName.toLowerCase().includes(q) && !lead.domain.toLowerCase().includes(q)) return false;
    }
    if (filter === 'replied')    return !!lead.reply;
    if (filter === 'no-reply')   return !lead.reply;
    if (filter === 'follow-up')  return !!lead.followUp;
    if (filter !== 'all') {
      const cat = lead.reply?.classification?.reply_category;
      return cat === filter;
    }
    return true;
  });

  const FILTERS: { key: string; label: string; count?: number }[] = [
    { key: 'all',           label: 'All',           count: approvedLeads.length },
    { key: 'replied',       label: 'Replied',        count: repliedCount },
    { key: 'no-reply',      label: 'No Reply',       count: approvedLeads.length - repliedCount },
    { key: 'INTERESTED',    label: 'Interested',     count: interestedCount },
    { key: 'NEEDS_INFO',    label: 'Needs Info' },
    { key: 'FOLLOW_UP_LATER', label: 'Follow Up' },
    { key: 'follow-up',     label: 'Follow-ups',     count: pendingFUCount },
  ];

  return (
    <div id="approved-dispatched-view" className="flex flex-col w-full pt-4 pb-10">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-base">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[17px] font-semibold text-primary tracking-tight">
              Approved & Dispatched
            </h1>
            <span className="crm-badge crm-badge-green text-[10px] font-bold">{approvedLeads.length}</span>
          </div>
          <p className="text-[11px] text-subtle mt-0.5">
            Outreach sent via Gmail · check for replies · manage follow-ups
          </p>
        </div>

        {/* Inline stats — compact, right-aligned */}
        <div className="hidden md:flex items-center gap-5 text-right shrink-0">
          <div>
            <div className="text-[9px] uppercase font-semibold tracking-wider text-subtle mb-0.5">Replied</div>
            <div className="font-['Manrope'] text-[15px] font-semibold text-primary tabular-nums">
              {repliedCount}<span className="text-subtle font-normal text-[11px]">/{approvedLeads.length}</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase font-semibold tracking-wider text-subtle mb-0.5">Interested</div>
            <div className="font-['Manrope'] text-[15px] font-semibold text-emerald-500 tabular-nums">{interestedCount}</div>
          </div>
          {pendingFUCount > 0 && (
            <div>
              <div className="text-[9px] uppercase font-semibold tracking-wider text-subtle mb-0.5">Follow-ups Due</div>
              <div className="font-['Manrope'] text-[15px] font-semibold text-amber-500 tabular-nums">{pendingFUCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar + search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === key ? 'filter-active' : 'filter-inactive'
              }`}
            >
              {label}{count !== undefined ? ` · ${count}` : ''}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-44 shrink-0">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-crm has-icon w-full pl-7"
          />
        </div>
      </div>

      {/* Empty states */}
      {approvedLeads.length === 0 && (
        <div className="py-16 text-center bg-card rounded-lg border border-base text-subtle text-sm">
          No approved leads yet.
        </div>
      )}
      {approvedLeads.length > 0 && filtered.length === 0 && (
        <div className="py-10 text-center bg-card rounded-lg border border-base text-subtle text-sm">
          No leads match the current filter.
        </div>
      )}

      {/* Lead list — table-density rows with expand accordion */}
      {filtered.length > 0 && (
        <div className="bg-card border border-base rounded-lg overflow-hidden divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {/* Table head */}
          <div className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto] items-center px-4 py-2 bg-subtle">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-subtle">Company / Contact</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-subtle hidden md:block">Subject</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-subtle text-right">Reply</span>
          </div>

          {filtered.map((lead) => {
            const rs: ReplyState = replyStates[lead.id] ?? {
              status: lead.reply ? 'found' : 'idle',
              reply: lead.reply ?? undefined,
              expanded: false,
            };
            const isExpanded = rs.status === 'found' && rs.expanded;
            const hasReply   = Boolean(lead.reply || (rs.status === 'found' && rs.reply));
            const reply      = rs.reply ?? lead.reply;
            const cls        = reply?.classification;
            const catCfg     = cls ? CAT[cls.reply_category] ?? CAT['UNCLEAR'] : null;

            return (
              <div
                key={lead.id}
                ref={el => { leadRefs.current[lead.id] = el; }}
              >
                {/* Compact row */}
                <div className={`grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto] items-center gap-3 px-4 py-2.5 transition-colors ${
                  isExpanded ? 'row-active' : 'row-hover'
                }`}>

                  {/* Col 1: Company + contact */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status dot */}
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasReply ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className="text-[13px] font-semibold text-primary truncate">{lead.companyName}</span>
                      {lead.domain && (
                        <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer"
                          className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-subtle hover:text-accent transition-colors">
                          {lead.domain}<ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {catCfg && (
                        <span className={`crm-badge text-[9px] ${catCfg.badgeClass} flex items-center gap-1`}>
                          {catCfg.icon}{catCfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                      <span>{lead.personaName}</span>
                      {lead.personaEmail && <span className="hidden lg:inline text-subtle">· {lead.personaEmail}</span>}
                      {lead.approvedAt && <span className="hidden xl:inline text-subtle">· {lead.approvedAt}</span>}
                    </div>
                  </div>

                  {/* Col 2: Email subject (hidden on mobile) */}
                  <div className="hidden md:block min-w-0">
                    {lead.coldEmail?.subject && (
                      <span className="text-[11px] text-muted italic truncate block" title={lead.coldEmail.subject}>
                        "{lead.coldEmail.subject}"
                      </span>
                    )}
                    {lead.dispatchedSequence && (
                      <span className="text-[10px] text-subtle block mt-0.5">{lead.dispatchedSequence}</span>
                    )}
                  </div>

                  {/* Col 3: Action */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    {hasReply ? (
                      <button
                        onClick={() => toggleExpand(lead.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isExpanded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {isExpanded ? <>Hide<ChevronUp className="w-3 h-3" /></> : <>Reply<ChevronDown className="w-3 h-3" /></>}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckReply(lead)}
                        disabled={rs.status === 'checking'}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-base bg-hover hover:bg-elevated text-muted hover:text-primary text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {rs.status === 'checking'
                          ? <><RotateCw className="w-3 h-3 animate-spin text-accent" />Checking…</>
                          : <><Mail className="w-3 h-3" />Check Reply</>
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Accordion — reply + classification + follow-up */}
                {isExpanded && reply && (
                  <div className="accordion-body px-4 py-3 flex flex-col gap-2.5">
                    {/* Reply header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        Reply from <span className="text-muted font-normal">{reply.from_}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-subtle">
                        <Clock className="w-2.5 h-2.5" />{reply.receivedAt}
                      </span>
                    </div>

                    {/* Reply body */}
                    <div className="p-3 rounded border border-base bg-subtle text-[12px] text-primary whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                      {reply.body}
                    </div>

                    {/* Classification */}
                    {cls && <ClassificationPanel c={cls} />}

                    {/* Follow-up — only for FOLLOW_UP_LATER */}
                    {cls?.reply_category === 'FOLLOW_UP_LATER' && (
                      <FollowUpPanel leadId={lead.id} initialFollowUp={lead.followUp} />
                    )}
                  </div>
                )}

                {/* Status notices (inline, not a big card) */}
                {rs.status === 'not_found' && (
                  <div className="px-4 py-2 border-t border-base text-[10px] text-subtle flex items-center gap-1.5 bg-hover">
                    <Clock className="w-3 h-3" />
                    No reply found in Gmail for this thread yet.
                  </div>
                )}
                {rs.status === 'error' && (
                  <div className="px-4 py-2 border-t border-rose-500/20 text-[10px] text-rose-500 flex items-center gap-1.5 bg-red-tint">
                    <AlertTriangle className="w-3 h-3" />{rs.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count when filtered */}
      {filtered.length > 0 && filtered.length < approvedLeads.length && (
        <p className="text-[10px] text-subtle mt-2 text-center">
          Showing {filtered.length} of {approvedLeads.length} leads
        </p>
      )}
    </div>
  );
};
