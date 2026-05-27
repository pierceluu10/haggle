import {
  completeCallRecord,
  failCallRecord,
  getCallByProviderId
} from "@/lib/call-store";
import {
  callFailureReason,
  extractProviderId,
  extractTranscript,
  verifyElevenLabsWebhook
} from "@/lib/elevenlabs";
import type { CallResult } from "@/lib/types";
import { ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultFromTranscript(params: {
  transcript: string;
  transcriptSummary?: string;
  contactName: string;
}): CallResult {
  const summary =
    params.transcriptSummary ||
    `${params.contactName} call completed. Review the transcript for quote details.`;

  return {
    summary,
    priceText: "See transcript",
    availability: "See transcript",
    timeline: "See transcript",
    serviceNotes: "Captured from live ElevenLabs call.",
    transcript: params.transcript || summary,
    confidence: params.transcript ? "medium" : "low"
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("elevenlabs-signature") ||
      request.headers.get("x-elevenlabs-signature") ||
      request.headers.get("signature");

    if (!verifyElevenLabsWebhook(rawBody, signature)) {
      return Response.json({ ok: false }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as { type?: string };
    const providerId = extractProviderId(payload);
    const call = providerId ? getCallByProviderId(providerId) : undefined;

    if (!call) {
      return ok({ ok: true, ignored: "No matching call." }, { status: 202 });
    }

    if (payload.type === "call_initiation_failure") {
      failCallRecord(call.id, callFailureReason(payload));
      return ok({ ok: true });
    }

    if (payload.type !== "post_call_transcription") {
      return ok({ ok: true, ignored: "Unsupported webhook type." }, { status: 202 });
    }

    const transcriptData = extractTranscript(payload);
    completeCallRecord(
      call.id,
      resultFromTranscript({
        ...transcriptData,
        contactName: call.contactName
      })
    );

    return ok({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
