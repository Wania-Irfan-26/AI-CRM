/**
 * API service — thin fetch wrapper for the FastAPI backend.
 *
 * Base URL is read from the Vite environment variable VITE_API_BASE_URL.
 * For local development this should be http://localhost:8000
 */

import { Lead, Reply, Classification, FollowUp } from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Response shape returned by GET /api/leads
// ---------------------------------------------------------------------------

interface ApiDetectedPain {
  title: string;
  code: string | null;
  description: string | null;
}

interface ApiRecommendedPitch {
  title: string;
  fitLevel: string | null;
  description: string | null;
}

interface ApiCrewAiSignal {
  title: string;
  source: string | null;
  description: string | null;
}

interface ApiColdEmail {
  subject: string;
  body: string;
  version: string;
  tone: string | null;
  estimatedReadTime: string | null;
  activeVariant: 'crew' | 'direct' | 'custom';
  versions: [];
}

interface ApiLead {
  id: string;
  status: string;
  createdAt: string;
  companyName: string;
  domain: string;
  targetWebsiteUrl: string;
  companySummary: string;
  personaName: string | null;
  personaTitle: string | null;
  personaEmail: string | null;
  personaInitials: string;
  matchScore: null;
  linkedinSignal: null;
  hq: null;
  employees: null;
  fundingStage: null;
  category: null;
  timeAgo: null;
  detectedPain: ApiDetectedPain;
  recommendedPitch: ApiRecommendedPitch;
  crewAiSignal: ApiCrewAiSignal;
  confidenceVectors: null;
  coldEmail: ApiColdEmail;
  errorMessage: string | null;
  gmailMessageId: string | null;
  reply: {
    from_: string;
    receivedAt: string;
    body: string;
    classification?: Classification | null;
  } | null;
  followUp: FollowUp | null;
}

interface LeadsResponse {
  leads: ApiLead[];
  count: number;
}

// ---------------------------------------------------------------------------
// Map API response → frontend Lead interface
// ---------------------------------------------------------------------------

/**
 * Maps a single API lead object to the frontend Lead type.
 * Fields the backend cannot provide are set to safe fallback values.
 * No values are invented.
 */
function mapApiLeadToLead(api: ApiLead): Lead {
  return {
    id: api.id,

    // Company
    companyName: api.companyName || 'Unknown Company',
    domain: api.domain || '',
    companySummary: api.companySummary || '',

    // Contact — only name is available from the sheet
    personaName: api.personaName || '',
    personaTitle: api.personaTitle || '',
    personaEmail: api.personaEmail || '',
    personaInitials: api.personaInitials || '',

    // Fields backend does not provide — safe empty/null values
    matchScore: 0,
    linkedinSignal: '',
    hq: '',
    employees: '',
    fundingStage: '',
    category: 'Fintech & SaaS', // required by union type; will be addressed when backend adds it
    timeAgo: api.createdAt || '',
    recApi: api.recommendedPitch?.description || '',

    // Status: backend uses AI_COMPLETED; frontend uses 'pending' for the queue
    status: _mapStatus(api.status),

    // AI research
    detectedPain: {
      title: api.detectedPain?.title || 'Detected Pain',
      code: api.detectedPain?.code || '',
      description: api.detectedPain?.description || '',
    },
    recommendedPitch: {
      title: api.recommendedPitch?.title || 'Recommended Service',
      fitLevel: api.recommendedPitch?.fitLevel || '',
      description: api.recommendedPitch?.description || '',
    },
    crewAiSignal: {
      title: api.crewAiSignal?.title || 'AI Sales Signal',
      source: api.crewAiSignal?.source || '',
      description: api.crewAiSignal?.description || '',
    },

    // Confidence vectors — not in backend, set to neutral zeros
    confidenceVectors: {
      painMatch: 0,
      buyerPersona: 0,
      stackMatch: 0,
    },

    // Cold email
    coldEmail: {
      subject: api.coldEmail?.subject || '',
      body: api.coldEmail?.body || '',
      version: api.coldEmail?.version || 'v1.0',
      tone: api.coldEmail?.tone || '',
      estimatedReadTime: api.coldEmail?.estimatedReadTime || '',
      activeVariant: api.coldEmail?.activeVariant || 'crew',
      versions: [],
    },

    // Reply tracking
    gmailMessageId: api.gmailMessageId ?? null,
    reply: api.reply ?? null,

    // Follow-up management
    followUp: api.followUp ?? null,
  };
}

/**
 * Map backend status strings to the frontend status union type.
 * AI_COMPLETED → 'pending' (awaiting human review)
 * APPROVED     → 'approved'
 * REJECTED     → 'rejected'
 * anything else → 'pending' (safe default)
 */
function _mapStatus(backendStatus: string): 'pending' | 'approved' | 'rejected' {
  switch (backendStatus?.toUpperCase()) {
    case 'APPROVED':
    case 'SENT':
    case 'REPLIED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'pending';
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch all AI_COMPLETED leads from the FastAPI backend.
 * Returns a mapped array of Lead objects ready for React state.
 */
export async function fetchLeads(): Promise<Lead[]> {
  const response = await fetch(`${BASE_URL}/api/leads`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch leads (HTTP ${response.status})`
    );
  }

  const data: LeadsResponse = await response.json();
  return (data.leads || []).map(mapApiLeadToLead);
}

/**
 * Approve a lead — sends the cold email via Gmail and marks the Sheet row SENT.
 * Throws an Error with the backend's detail message if anything fails.
 */
export async function approveLead(leadId: string): Promise<{ recipient: string }> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/approve`, {
    method: 'POST',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Approve failed (HTTP ${response.status})`);
  }

  return { recipient: data.recipient ?? '' };
}

/**
 * Reject a lead — marks the Sheet row REJECTED and stores the reason.
 * Throws an Error with the backend's detail message if anything fails.
 */
export async function rejectLead(leadId: string, reason: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Reject failed (HTTP ${response.status})`);
  }
}

/**
 * Check Gmail for a reply to this lead's sent email.
 * Returns { replied: true, reply: Reply } if a reply was found,
 * or { replied: false } if not yet.
 * Throws on API/network errors.
 */
export async function fetchReplies(
  leadId: string
): Promise<{ replied: boolean; reply?: Reply }> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/replies`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Reply check failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (data.replied && data.reply) {
    return { replied: true, reply: data.reply as Reply };
  }
  return { replied: false };
}

/**
 * Ask the AI to generate a follow-up email draft for a FOLLOW_UP_LATER lead.
 * Saves the draft to the Sheet as PENDING and returns it for review.
 */
export async function generateFollowUp(leadId: string): Promise<FollowUp> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/followup/generate`, {
    method: 'POST',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Follow-up generation failed (HTTP ${response.status})`);
  }

  return data.follow_up as FollowUp;
}

/**
 * Approve and send the pending follow-up email via Gmail.
 * Returns the sent timestamp on success.
 */
export async function approveFollowUp(leadId: string): Promise<{ sentAt: string }> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/followup/approve`, {
    method: 'POST',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Follow-up send failed (HTTP ${response.status})`);
  }

  return { sentAt: data.follow_up_sent_at ?? '' };
}

/**
 * Cancel a pending follow-up draft.
 */
export async function cancelFollowUp(leadId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/leads/${leadId}/followup/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Follow-up cancel failed (HTTP ${response.status})`);
  }
}

// ---------------------------------------------------------------------------
// Dashboard types — mirrors GET /api/dashboard response shape
// ---------------------------------------------------------------------------

export interface DashboardKpis {
  total_leads: number;
  ai_processed: number;
  emails_sent: number;
  replies_received: number;
  interested_leads: number;
  followups_pending: number;
}

export interface DashboardFunnel {
  leads: number;
  ai_processed: number;
  emails_sent: number;
  replies: number;
  interested: number;
  followups: number;
}

export interface DashboardReplyBreakdown {
  INTERESTED: number;
  NEEDS_INFO: number;
  FOLLOW_UP_LATER: number;
  NOT_INTERESTED: number;
  BOUNCE: number;
  UNCLEAR: number;
}

export interface DashboardFollowupBreakdown {
  PENDING: number;
  APPROVED: number;
  SENT: number;
  CANCELLED: number;
}

export interface DashboardActivity {
  type: string;
  lead_id: string;
  company: string;
  contact: string;
  timestamp: string;
  description: string;
}

export interface DashboardActionItem {
  lead_id: string;
  company: string;
  contact: string;
  email: string;
  category: string | null;
  priority: number;
  reason: string;
  follow_up_status: string | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  funnel: DashboardFunnel;
  reply_breakdown: DashboardReplyBreakdown;
  followup_breakdown: DashboardFollowupBreakdown;
  recent_activity: DashboardActivity[];
  action_required: DashboardActionItem[];
}

/**
 * Fetch all dashboard metrics from the FastAPI backend.
 * Calls GET /api/dashboard — read-only, no side effects.
 */
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(`${BASE_URL}/api/dashboard`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch dashboard (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<DashboardData>;
}
