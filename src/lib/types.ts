export type CallStatus = "calling" | "completed" | "failed";

export type CallResult = {
  summary: string;
  priceText: string;
  availability: string;
  timeline: string;
  serviceNotes: string;
  transcript: string;
  confidence: "low" | "medium" | "high";
};

export type CallRole = "inquiry" | "negotiation";

export type CallRecord = {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  role?: CallRole;
  status: CallStatus;
  createdAt: string;
  updatedAt: string;
  conversationId?: string;
  callSid?: string;
  failureReason?: string;
  result?: CallResult;
};
