import crypto from "node:crypto";
import type { DemoContact } from "@/lib/contacts";
import type { CallRole } from "@/lib/demo-call";
import { isDemoMode, resolveAgentId, shouldUseLiveCalls } from "@/lib/utils";

export type OutboundCallResult = {
  provider: "elevenlabs_twilio" | "demo";
  status: "calling" | "completed";
  conversationId?: string;
  callSid?: string;
  agentRole: CallRole;
};

export function buildDynamicVariables(params: {
  contact: DemoContact;
  userMessage?: string;
  role: CallRole;
}): Record<string, string> {
  const isNegotiation = params.role === "negotiation";

  return {
    business_name: params.contact.name,
    business_phone: params.contact.phone,
    call_purpose: params.role,
    user_request:
      params.userMessage ||
      (isNegotiation
        ? "Customer asked Haggle to negotiate price with this dealer."
        : "Customer asked Haggle Concierge to place an outbound quote call."),
    negotiation_allowed: isNegotiation ? "true" : "false",
    vehicle: isNegotiation ? "Honda Civic Type R" : "",
    target_price: isNegotiation ? "31000" : ""
  };
}

export async function startOutboundCall(params: {
  contact: DemoContact;
  userMessage?: string;
  role: CallRole;
}): Promise<OutboundCallResult> {
  if (!shouldUseLiveCalls()) {
    return { provider: "demo", status: "completed", agentRole: params.role };
  }

  const agentId = resolveAgentId(params.role);
  if (!agentId) {
    throw new Error(
      params.role === "negotiation"
        ? "Missing negotiator agent. Set ELEVENLABS_NEGOTIATION_AGENT_ID (or ELEVENLABS_AGENT_ID)."
        : "Missing concierge agent. Set ELEVENLABS_INQUIRY_AGENT_ID (or ELEVENLABS_AGENT_ID)."
    );
  }

  const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY || ""
    },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      to_number: params.contact.phone,
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
    callSid: payload.callSid ?? undefined,
    agentRole: params.role
  };
}

export function verifyElevenLabsWebhook(body: string, signature: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret || isDemoMode()) {
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
