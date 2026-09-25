import React, { useState } from 'react';
import { Lead, Reply, Classification, FollowUp } from '../types';
import { CheckCircle2, Send, Mail, RotateCw, MessageSquare, Clock, ChevronUp, Calendar, CheckCircle, X } from 'lucide-react';
import { fetchReplies, generateFollowUp, approveFollowUp, cancelFollowUp } from '../services/api';

interface ApprovedViewProps {
  approvedLeads: Lead[];
}

interface ReplyState {
  status: 'idle' | 'checking' | 'found' | 'not_found' | 'error';
  reply?: Reply;
  error?: string;
  expanded?: boolean;
}

// Per-category config: emoji, headline, action icon, colour tokens
const CATEGORY_CONFIG: Record<string, {
  emoji: string;
  headline: string;
  actionIcon: string;
  pill: string;       // pill bg + text
  border: string;
  accent: string;     // text colour for action line
  panelBg: string;
}> = {
  INTERESTED: {
    emoji: '🔥',
    headline: 'Hot Lead · Interested',
    actionIcon: '📅',
    pill: 'bg-[#58e7aa]/20 text-[#58e7aa]',
    border: 'border-[#58e7aa]/25',
    accent: 'text-[#58e7aa]',
    panelBg: 'bg-gradient-to-br from-[#58e7aa]/10 to-[#1c2028]',
  },
  NEEDS_INFO: {
    emoji: '📋',
    headline: 'Warm Lead · Needs Info',
    actionIcon: '📨',
    pill: 'bg-[#f2ca50]/20 text-[#f2ca50]',
    border: 'border-[#f2ca50]/25',
    accent: 'text-[#f2ca50]',
    panelBg: 'bg-gradient-to-br from-[#f2ca50]/8 to-[#1c2028]',
  },
  FOLLOW_UP_LATER: {
    emoji: '🕐',
    headline: 'Soft Yes · Follow Up Later',
    actionIcon: '🗓️',
    pill: 'bg-[#93c5fd]/20 text-[#93c5fd]',
    border: 'border-[#93c5fd]/25',
    accent: 'text-[#93c5fd]',
    panelBg: 'bg-gradient-to-br from-[#93c5fd]/8 to-[#1c2028]',
  },
  NOT_INTERESTED: {
    emoji: '🚫',
    headline: 'Not Interested',
    actionIcon: '📁',
    pill: 'bg-[#ffb4ab]/15 text-[#ffb4ab]',
    border: 'border-[#ffb4ab]/20',
    accent: 'text-[#ffb4ab]',
    panelBg: 'bg-[#1c2028]',
  },
  BOUNCE: {
    emoji: '⚠️',
    headline: 'Delivery Bounce',
    actionIcon: '🔁',
    pill: 'bg-[#31353e] text-[#99907c]',
    border: 'border-white/8',
    accent: 'text-[#d0c5af]',
    panelBg: 'bg-[#1c2028]',
  },
  UNCLEAR: {
    emoji: '🤔',
    headline: 'Unclear Intent',
    actionIcon: '💬',
    pill: 'bg-[#31353e] text-[#d0c5af]',
    border: 'border-white/8',
    accent: 'text-[#d0c5af]',
    panelBg: 'bg-[#1c2028]',
  },
};

function _formatTimestamp(raw: string): string {
  if (!raw) return '';
  // Attempt to parse "2026-09-24 18:37:00 UTC" or ISO strings
  try {
    const d = new Date(raw.replace(' UTC', 'Z'));
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

function ClassificationPanel({ classification }: { classification: Classification }) {
  const cfg = CATEGORY_CONFIG[classification.reply_category] ?? CATEGORY_CONFIG['UNCLEAR'];

  return (
    <div className={`mt-1 rounded-xl border ${cfg.border} ${cfg.panelBg} overflow-hidden`}>

      {/* Top strip — headline + pill */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[18px] leading-none select-none">{cfg.emoji}</span>
          <span className="font-['Manrope'] text-[15px] font-bold text-[#dfe2ee] leading-tight">
            {cfg.headline}
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${cfg.pill}`}>
          AI Signal
        </span>
      </div>

      <div className="h-px bg-white/5 mx-4" />

      {/* Action row */}
      <div className="px-4 py-3 flex flex-col gap-0.5">
        <span className="font-['Hanken_Grotesk'] text-[10px] font-semibold text-[#99907c] uppercase tracking-widest">
          Suggested next step
        </span>
        <div className="flex items-start gap-2 mt-1">
          <span className="text-[15px] leading-none shrink-0 mt-0.5 select-none">{cfg.actionIcon}</span>
          <p className={`font-['Hanken_Grotesk'] text-[13px] font-semibold leading-snug ${cfg.accent}`}>
            {classification.sales_action}
          </p>
        </div>
      </div>

      {/* Reason row */}
      <div className="px-4 pb-3">
        <p className="font-['Hanken_Grotesk'] text-[12px] text-[#99907c] leading-relaxed italic">
          "{classification.classification_reason}"
        </p>
      </div>

      {/* Footer timestamp */}
      {classification.classified_at && (
        <div className="px-4 pb-3">
          <span className="font-['Hanken_Grotesk'] text-[10px] text-[#99907c]/70 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#58e7aa]/60 shrink-0" />
            AI analyzed · {_formatTimestamp(classification.classified_at)}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Follow-Up Panel — shown inside reply panel for FOLLOW_UP_LATER leads
// ---------------------------------------------------------------------------

interface FollowUpPanelProps {
  leadId: string;
  initialFollowUp: FollowUp | null | undefined;
}

function FollowUpPanel({ leadId, initialFollowUp }: FollowUpPanelProps) {
  const [followUp, setFollowUp] = useState<FollowUp | null>(initialFollowUp ?? null);
  const [subject, setSubject] = useState(initialFollowUp?.follow_up_subject ?? '');
  const [body, setBody] = useState(initialFollowUp?.follow_up_body ?? '');
  const [busy, setBusy] = useState<'generating' | 'approving' | 'cancelling' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = followUp?.follow_up_status ?? null;

  const handleGenerate = async () => {
    setBusy('generating');
    setError(null);
    try {
      const draft = await generateFollowUp(leadId);
      setFollowUp(draft);
      setSubject(draft.follow_up_subject ?? '');
      setBody(draft.follow_up_body ?? '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async () => {
    setBusy('approving');
    setError(null);
    try {
      const { sentAt } = await approveFollowUp(leadId);
      setFollowUp((prev) => prev ? { ...prev, follow_up_status: 'SENT', follow_up_sent_at: sentAt } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setBusy('cancelling');
    setError(null);
    try {
      await cancelFollowUp(leadId);
      setFollowUp((prev) => prev ? { ...prev, follow_up_status: 'CANCELLED' } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancel failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-1 rounded-xl border border-[#93c5fd]/20 bg-gradient-to-br from-[#93c5fd]/8 to-[#1c2028] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#93c5fd]" />
          <span className="font-['Manrope'] text-[14px] font-bold text-[#dfe2ee]">
            AI Follow-Up
          </span>
        </div>
        {status === 'SENT' ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#58e7aa]/20 text-[#58e7aa]">
            Sent
          </span>
        ) : status === 'CANCELLED' ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#31353e] text-[#99907c]">
            Cancelled
          </span>
        ) : status === 'PENDING' ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#93c5fd]/20 text-[#93c5fd]">
            Pending Review
          </span>
        ) : null}
      </div>

      <div className="h-px bg-white/5 mx-4" />

      {/* No draft yet */}
      {!status || status === 'CANCELLED' ? (
        <div className="px-4 py-4 flex flex-col gap-3">
          {status === 'CANCELLED' && (
            <p className="font-['Hanken_Grotesk'] text-[12px] text-[#99907c]">
              Follow-up was cancelled. You can generate a new draft.
            </p>
          )}
          {!status && (
            <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
              This prospect asked to be contacted later. Generate an AI follow-up draft to review and send.
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={busy === 'generating'}
            className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-[#93c5fd]/20 hover:bg-[#93c5fd]/30 text-[#93c5fd] font-['Hanken_Grotesk'] text-[13px] font-semibold transition-all border border-[#93c5fd]/25 disabled:opacity-50"
          >
            {busy === 'generating' ? (
              <><RotateCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
            ) : (
              <><Calendar className="w-3.5 h-3.5" /> Generate Follow-Up Draft</>
            )}
          </button>
          {error && <p className="font-['Hanken_Grotesk'] text-[12px] text-[#ffb4ab]">{error}</p>}
        </div>
      ) : null}

      {/* Draft ready for review */}
      {status === 'PENDING' && (
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Recommended date */}
          {followUp?.follow_up_date && (
            <div className="flex items-center gap-2">
              <span className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] uppercase tracking-widest font-semibold">
                Recommended date
              </span>
              <span className="font-['Hanken_Grotesk'] text-[12px] font-bold text-[#93c5fd]">
                {followUp.follow_up_date}
              </span>
            </div>
          )}

          {/* Editable subject */}
          <div className="flex flex-col gap-1">
            <label className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] uppercase tracking-widest font-semibold">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-[#0a0e16] border border-white/10 rounded-lg px-3 py-1.5 font-['Hanken_Grotesk'] text-[13px] text-[#dfe2ee] focus:outline-none focus:border-[#93c5fd]/50"
            />
          </div>

          {/* Editable body */}
          <div className="flex flex-col gap-1">
            <label className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] uppercase tracking-widest font-semibold">
              Message
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-[#0a0e16] border border-white/10 rounded-lg px-3 py-2 font-['Hanken_Grotesk'] text-[13px] text-[#dfe2ee] leading-relaxed resize-y focus:outline-none focus:border-[#93c5fd]/50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApprove}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#58e7aa] hover:bg-[#3fd492] text-[#0a2e1e] font-['Hanken_Grotesk'] text-[13px] font-bold transition-all disabled:opacity-50"
            >
              {busy === 'approving' ? (
                <><RotateCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-3.5 h-3.5" /> Approve & Send</>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#99907c] hover:text-[#ffb4ab] font-['Hanken_Grotesk'] text-[13px] font-medium transition-all border border-white/5 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
          {error && <p className="font-['Hanken_Grotesk'] text-[12px] text-[#ffb4ab]">{error}</p>}
        </div>
      )}

      {/* Already sent */}
      {status === 'SENT' && (
        <div className="px-4 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#58e7aa]" />
            <p className="font-['Hanken_Grotesk'] text-[13px] font-semibold text-[#58e7aa]">
              Follow-up email sent.
            </p>
          </div>
          {followUp?.follow_up_sent_at && (
            <p className="font-['Hanken_Grotesk'] text-[11px] text-[#99907c] flex items-center gap-1 ml-6">
              <Clock className="w-3 h-3" />
              {followUp.follow_up_sent_at}
            </p>
          )}
          {followUp?.follow_up_subject && (
            <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af] ml-6 italic">
              "{followUp.follow_up_subject}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const ApprovedView: React.FC<ApprovedViewProps> = ({ approvedLeads }) => {
  // Per-lead reply state keyed by lead.id
  const [replyStates, setReplyStates] = useState<Record<string, ReplyState>>({});

  const setReplyState = (leadId: string, state: ReplyState) => {
    setReplyStates((prev) => ({ ...prev, [leadId]: state }));
  };

  const handleCheckReply = async (lead: Lead) => {
    // If already found and expanded, do nothing (collapse is handled separately)
    if (replyStates[lead.id]?.status === 'found') {
      setReplyState(lead.id, { ...replyStates[lead.id], expanded: true });
      return;
    }

    // If reply already loaded from the Sheet on initial load, show it immediately
    if (lead.reply) {
      setReplyState(lead.id, { status: 'found', reply: lead.reply, expanded: true });
      return;
    }

    setReplyState(lead.id, { status: 'checking' });
    try {
      const result = await fetchReplies(lead.id);
      if (result.replied && result.reply) {
        setReplyState(lead.id, { status: 'found', reply: result.reply, expanded: true });
      } else {
        setReplyState(lead.id, { status: 'not_found' });
      }
    } catch (err: unknown) {
      setReplyState(lead.id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleCollapse = (leadId: string) => {
    setReplyStates((prev) => ({
      ...prev,
      [leadId]: { ...prev[leadId], expanded: false },
    }));
  };

  return (
    <div id="approved-dispatched-view" className="flex flex-col gap-6 py-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] text-[28px] font-bold text-[#dfe2ee]">
              Approved & Dispatched Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#58e7aa]/15 text-[#58e7aa] font-['Hanken_Grotesk'] text-xs font-semibold border border-[#58e7aa]/20">
              {approvedLeads.length} Authorizations
            </span>
          </div>
          <p className="font-['Hanken_Grotesk'] text-[14px] text-[#d0c5af]">
            Executive-validated cold email dispatches synced to Google Sheets.
          </p>
        </div>
      </div>

      {/* List of Approved Leads */}
      <div className="flex flex-col gap-4">
        {approvedLeads.map((lead) => {
          const rs: ReplyState = replyStates[lead.id] ?? {
            // Pre-populate from Sheet data if available — start collapsed
            status: lead.reply ? 'found' : 'idle',
            reply: lead.reply ?? undefined,
            expanded: false,
          };

          return (
            <div
              key={lead.id}
              className="rounded-xl bg-[#181c24] border border-white/5 shadow-sm hover:border-white/10 transition-colors overflow-hidden"
            >
              {/* Lead row */}
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#58e7aa]/20 text-[#58e7aa] flex items-center justify-center shrink-0 border border-[#58e7aa]/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Manrope'] text-base font-bold text-[#dfe2ee]">
                        {lead.companyName}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded bg-[#0a0e16] font-mono text-[11px] text-[#bcc7de] border border-white/5">
                        {lead.domain}
                      </span>
                    </div>
                    <p className="text-xs text-[#d0c5af] mt-0.5">
                      Contact:{' '}
                      <span className="text-[#dfe2ee] font-medium">{lead.personaName}</span>
                      {lead.personaEmail && (
                        <span className="text-[#99907c]"> • {lead.personaEmail}</span>
                      )}
                    </p>
                    <p className="text-xs text-[#99907c] mt-1 italic line-clamp-1">
                      "{lead.coldEmail.subject}"
                    </p>
                  </div>
                </div>

                {/* Right side: sent info + check reply button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-[#58e7aa] font-semibold block">
                      {lead.approvedAt || 'Recently Sent'}
                    </span>
                    <span className="text-[11px] text-[#99907c]">
                      {lead.dispatchedSequence || 'Email dispatched'}
                    </span>
                  </div>

                  {/* Reply status icon */}
                  {rs.status === 'found' ? (
                    <span
                      className="p-2 rounded-lg bg-[#58e7aa]/20 text-[#58e7aa] border border-[#58e7aa]/30"
                      title="Reply received"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-2 rounded-lg bg-[#262a33] text-[#f2ca50]">
                      <Send className="w-4 h-4" />
                    </span>
                  )}

                  {/* Check for Reply button */}
                  <button
                    onClick={() => handleCheckReply(lead)}
                    disabled={rs.status === 'checking'}
                    className="px-3 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#d0c5af] hover:text-[#dfe2ee] font-['Hanken_Grotesk'] text-[12px] font-medium transition-all flex items-center gap-1.5 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rs.status === 'checking' ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Checking...
                      </>
                    ) : rs.status === 'found' ? (
                      <>
                        <MessageSquare className="w-3.5 h-3.5 text-[#58e7aa]" />
                        View Reply
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        Check for Reply
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Reply panel — shown only when found AND expanded */}
              {rs.status === 'found' && rs.reply && rs.expanded && (
                <div className="mx-5 mb-5 p-4 rounded-xl bg-[#1c2028] border border-[#58e7aa]/20 flex flex-col gap-3">
                  {/* Panel header with collapse button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#58e7aa]" />
                      <span className="font-['Hanken_Grotesk'] text-[13px] font-semibold text-[#58e7aa]">
                        Reply Received
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[#99907c] text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>{rs.reply.receivedAt}</span>
                      </div>
                      {/* Collapse button — icon only, no text */}
                      <button
                        onClick={() => handleCollapse(lead.id)}
                        className="p-1 rounded-lg text-[#99907c] hover:text-[#dfe2ee] hover:bg-white/5 transition-colors"
                        title="Collapse"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">
                    <span className="text-[#bcc7de] font-medium">From: </span>
                    {rs.reply.from_}
                  </p>
                  <div className="p-3 rounded-lg bg-[#0a0e16] border border-white/5">
                    <p className="font-['Hanken_Grotesk'] text-[13px] text-[#dfe2ee] leading-relaxed whitespace-pre-wrap">
                      {rs.reply.body}
                    </p>
                  </div>

                  {/* AI Classification panel */}
                  {rs.reply.classification && (
                    <ClassificationPanel classification={rs.reply.classification} />
                  )}

                  {/* Follow-up panel — only for FOLLOW_UP_LATER */}
                  {rs.reply.classification?.reply_category === 'FOLLOW_UP_LATER' && (
                    <FollowUpPanel
                      leadId={lead.id}
                      initialFollowUp={lead.followUp}
                    />
                  )}
                </div>
              )}

              {/* No reply yet notice */}
              {rs.status === 'not_found' && (
                <div className="mx-5 mb-5 p-3 rounded-xl bg-[#1c2028] border border-white/5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#99907c] shrink-0" />
                  <span className="font-['Hanken_Grotesk'] text-[12px] text-[#99907c]">
                    No reply received yet. Check again later.
                  </span>
                </div>
              )}

              {/* Error notice */}
              {rs.status === 'error' && (
                <div className="mx-5 mb-5 p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/20 flex items-center gap-2">
                  <span className="font-['Hanken_Grotesk'] text-[12px] text-[#ffb4ab]">
                    {rs.error}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
