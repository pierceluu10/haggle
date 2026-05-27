import crypto from "node:crypto";
import type { BusinessLead, CallAttempt, CallPurpose, ServiceRequest } from "@/lib/types";
import { shouldUseLiveCalls } from "@/lib/utils";

export type OutboundCallResult = {
  provider: "elevenlabs_twilio" | "demo";
  status: "calling" | "completed";
  conversationId?: string;
  callSid?: string;
};

export function buildDynamicVariables(params: {
  request: ServiceRequest;
  business: BusinessLead;
  purpose: CallPurpose;
  negotiationAllowed: boolean;
  targetPrice?: string;
  maxPrice?: string;
  negotiationNotes?: string;
}): Record<string, string | number | boolean> {
  return {
    request_id: params.request.id,
    business_id: params.business.id,
    business_name: params.business.name,
    business_phone: params.business.phone,
    user_request: params.request.description,
    service_type: params.request.serviceType,
    location: params.request.location,
    budget: params.request.budget,
    timeline: params.request.timeline,
    preferences: params.request.preferences,
    dealbreakers: params.request.dealbreakers,
    call_opening: params.request.callPlan.opening,
    call_questions: params.request.callPlan.questions.join(" | "),
    negotiation_allowed: params.negotiationAllowed,
    call_purpose: params.purpose,
    target_price: params.targetPrice || "",
    max_price: params.maxPrice || "",
    negotiation_notes: params.negotiationNotes || ""
  };
}

export async function startOutboundCall(params: {
  request: ServiceRequest;
  business: BusinessLead;
  purpose: CallPurpose;
  negotiationAllowed: boolean;
  targetPrice?: string;
  maxPrice?: string;
  negotiationNotes?: string;
}): Promise<OutboundCallResult> {
  if (!shouldUseLiveCalls()) {
    return {
      provider: "demo",
      status: "completed"
    };
  }

  const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY || ""
    },
    body: JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      to_number: params.business.phone,
      conversation_initiation_client_data: {
        dynamic_variables: buildDynamicVariables(params)
      },
      call_recording_enabled: false
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs outbound call failed with ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as {
    conversation_id?: string | null;
    callSid?: string | null;
  };

  return {
    provider: "elevenlabs_twilio",
    status: "calling",
    conversationId: payload.conversation_id ?? undefined,
    callSid: payload.callSid ?? undefined
  };
}

export function verifyElevenLabsWebhook(body: string, signature: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  if (!secret || process.env.DEMO_MODE === "true") {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const normalizedSignature = signature.replace(/^sha256=/, "");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(normalizedSignature, "hex")
  );
}

export function extractProviderId(payload: unknown): string | undefined {
  const event = payload as {
    data?: {
      conversation_id?: string;
      metadata?: { body?: { CallSid?: string; call_sid?: string } };
    };
  };

  return (
    event.data?.conversation_id ||
    event.data?.metadata?.body?.CallSid ||
    event.data?.metadata?.body?.call_sid
  );
}

export function extractTranscript(payload: unknown): {
  transcript: string;
  transcriptSummary?: string;
} {
  const event = payload as {
    data?: {
      transcript?: Array<{ role?: string; message?: string; text?: string }>;
      analysis?: { transcript_summary?: string };
    };
  };

  const transcript = Array.isArray(event.data?.transcript)
    ? event.data.transcript
        .map((entry) => `${entry.role || "speaker"}: ${entry.message || entry.text || ""}`)
        .join("\n")
    : "";

  return {
    transcript,
    transcriptSummary: event.data?.analysis?.transcript_summary
  };
}

export function callFailureReason(payload: unknown): string {
  const event = payload as {
    data?: {
      failure_reason?: string;
      metadata?: { body?: { CallStatus?: string; error_reason?: string } };
    };
  };

  return (
    event.data?.failure_reason ||
    event.data?.metadata?.body?.error_reason ||
    event.data?.metadata?.body?.CallStatus ||
    "Call failed before transcript was captured."
  );
}

export function hasProviderIds(call: CallAttempt): boolean {
  return Boolean(call.conversationId || call.callSid);
}
