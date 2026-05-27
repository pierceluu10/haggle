export type CallPurpose = "inquiry" | "negotiation";

export type CallStatus =
  | "queued"
  | "calling"
  | "completed"
  | "failed"
  | "skipped";

export type BusinessSource = "google_places" | "manual" | "demo";

export type RequestStatus =
  | "draft"
  | "businesses_found"
  | "calls_ready"
  | "calling"
  | "summarized"
  | "negotiating"
  | "recommended";

export type IntakeInput = {
  description: string;
  serviceType: string;
  location: string;
  budget: string;
  timeline: string;
  preferences: string;
  dealbreakers: string;
  urgency: "low" | "normal" | "urgent";
};

export type CallPlan = {
  opening: string;
  questions: string[];
  summaryGoals: string[];
  negotiationGuardrails: string[];
};

export type ServiceRequest = IntakeInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  callPlan: CallPlan;
};

export type BusinessLead = {
  id: string;
  requestId: string;
  name: string;
  phone: string;
  address: string;
  website?: string;
  contactName?: string;
  rating?: number;
  source: BusinessSource;
  selected: boolean;
  notes?: string;
};

export type CallAttempt = {
  id: string;
  requestId: string;
  businessId: string;
  purpose: CallPurpose;
  status: CallStatus;
  createdAt: string;
  updatedAt: string;
  provider: "elevenlabs_twilio" | "demo";
  conversationId?: string;
  callSid?: string;
  failureReason?: string;
  retryCount: number;
};

export type CallSummary = {
  id: string;
  requestId: string;
  businessId: string;
  callAttemptId: string;
  purpose: CallPurpose;
  transcript: string;
  summary: string;
  priceMin?: number;
  priceMax?: number;
  priceText: string;
  availability: string;
  timeline: string;
  serviceNotes: string;
  missingInfo: string[];
  confidence: "low" | "medium" | "high";
  outcome: "quote_collected" | "voicemail" | "unavailable" | "needs_follow_up";
  createdAt: string;
};

export type NegotiationInstruction = {
  id: string;
  requestId: string;
  businessIds: string[];
  targetPrice: string;
  maxPrice: string;
  strategy: "lowest_price" | "fastest_availability" | "best_value";
  notes: string;
  approvedAt: string;
};

export type Recommendation = {
  requestId: string;
  bestBusinessId?: string;
  headline: string;
  rationale: string;
  tradeoffs: string[];
  nextSteps: string[];
  generatedAt: string;
};

export type AppSnapshot = {
  request?: ServiceRequest;
  businesses: BusinessLead[];
  calls: CallAttempt[];
  summaries: CallSummary[];
  recommendation?: Recommendation;
  negotiation?: NegotiationInstruction;
};
