export interface DetectedPain {
  title: string;
  code: string;
  description: string;
}

export interface RecommendedPitch {
  title: string;
  fitLevel: string;
  description: string;
}

export interface CrewAiSignal {
  title: string;
  source: string;
  description: string;
}

export interface ConfidenceVectors {
  painMatch: number;
  buyerPersona: number;
  stackMatch: number;
}

export interface EmailVersion {
  id: string;
  label: string;
  subject: string;
  body: string;
  tone: string;
  words: number;
  timestamp: string;
}

export interface ColdEmailDraft {
  version: string;
  tone: string;
  subject: string;
  body: string;
  estimatedReadTime: string;
  activeVariant: 'crew' | 'direct' | 'custom';
  versions: EmailVersion[];
}

export interface Classification {
  reply_category: 'INTERESTED' | 'NEEDS_INFO' | 'FOLLOW_UP_LATER' | 'NOT_INTERESTED' | 'BOUNCE' | 'UNCLEAR';
  sales_action: string;
  classification_reason: string;
  classified_at: string;
}

export interface Reply {
  from_: string;
  receivedAt: string;
  body: string;
  classification?: Classification | null;
}

export interface FollowUp {
  follow_up_date: string | null;
  follow_up_status: 'PENDING' | 'APPROVED' | 'SENT' | 'CANCELLED';
  follow_up_subject: string | null;
  follow_up_body: string | null;
  follow_up_sent_at: string | null;
}

export interface Lead {
  id: string;
  companyName: string;
  domain: string;
  matchScore: number;
  personaName: string;
  personaTitle: string;
  personaEmail: string;
  personaInitials: string;
  linkedinSignal: string;
  hq: string;
  employees: string;
  fundingStage: string;
  companySummary: string;
  recApi: string;
  category: 'Supply Chain & Logistics' | 'Fintech & SaaS' | 'Healthcare & Bio' | 'Energy AI' | 'Retail & E-commerce';
  timeAgo: string;
  status: 'pending' | 'approved' | 'rejected';
  detectedPain: DetectedPain;
  recommendedPitch: RecommendedPitch;
  crewAiSignal: CrewAiSignal;
  confidenceVectors: ConfidenceVectors;
  coldEmail: ColdEmailDraft;
  rejectionReason?: string;
  approvedAt?: string;
  dispatchedSequence?: string;
  // Reply tracking
  gmailMessageId?: string | null;
  reply?: Reply | null;
  // Follow-up management
  followUp?: FollowUp | null;
}

export type NavTab = 'dashboard' | 'leads' | 'ai-emails' | 'approved' | 'rejected' | 'settings';
export type FilterTab = 'all' | 'high-score' | 'fintech' | 'supply-chain';
