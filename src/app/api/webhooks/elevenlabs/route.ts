import {
  callFailureReason,
  extractProviderId,
  extractTranscript,
  verifyElevenLabsWebhook
} from "@/lib/elevenlabs";
import { summarizeTranscript } from "@/lib/ai";
import { ok, serverError } from "@/lib/http";
import {
  getBusiness,
  getCallAttemptByProviderId,
  getServiceRequest,
  saveCallSummary,
  updateCallAttempt
} from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const call = providerId ? await getCallAttemptByProviderId(providerId) : undefined;

    if (!call) {
      return ok({ ok: true, ignored: "No matching call attempt." }, { status: 202 });
    }

    if (payload.type === "call_initiation_failure") {
      await updateCallAttempt(call.id, {
        status: "failed",
        failureReason: callFailureReason(payload)
      });
      return ok({ ok: true });
    }

    if (payload.type !== "post_call_transcription") {
      return ok({ ok: true, ignored: "Unsupported webhook type." }, { status: 202 });
    }

    const serviceRequest = await getServiceRequest(call.requestId);
    const business = await getBusiness(call.businessId);

    if (!serviceRequest || !business) {
      return ok({ ok: true, ignored: "Call is missing linked request or business." }, { status: 202 });
    }

    const transcriptData = extractTranscript(payload);
    const summary = await summarizeTranscript({
      request: serviceRequest,
      business,
      callAttemptId: call.id,
      purpose: call.purpose,
      transcript: transcriptData.transcript,
      transcriptSummary: transcriptData.transcriptSummary
    });

    await saveCallSummary(summary);
    return ok({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
