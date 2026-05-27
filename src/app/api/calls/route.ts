import { buildDemoSummary } from "@/lib/demo-data";
import { startOutboundCall } from "@/lib/elevenlabs";
import { ok, badRequest, notFound, serverError } from "@/lib/http";
import {
  createCallAttempt,
  getBusiness,
  getServiceRequest,
  getSnapshot,
  saveCallSummary,
  saveNegotiation,
  updateCallAttempt
} from "@/lib/store";
import type { NegotiationInstruction } from "@/lib/types";
import { callRequestSchema } from "@/lib/validation";
import { createId, isValidPhoneNumber, nowIso, shouldUseLiveCalls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = callRequestSchema.parse(await request.json());
    const serviceRequest = await getServiceRequest(input.requestId);

    if (!serviceRequest) {
      return notFound("Service request not found.");
    }

    if (input.purpose === "negotiation" && !input.negotiation) {
      return badRequest(new Error("Negotiation calls require user-approved limits."));
    }

    const businesses = [];
    for (const businessId of input.businessIds) {
      const business = await getBusiness(businessId);
      if (!business || business.requestId !== serviceRequest.id) {
        return notFound("One of the selected businesses was not found.");
      }
      if (!business.selected) {
        return badRequest(new Error(`${business.name} has not been approved for calls.`));
      }
      if (!isValidPhoneNumber(business.phone)) {
        return badRequest(new Error(`${business.name} does not have a valid phone number.`));
      }
      businesses.push(business);
    }

    let negotiation: NegotiationInstruction | undefined;
    if (input.purpose === "negotiation" && input.negotiation) {
      negotiation = await saveNegotiation({
        id: createId("neg"),
        requestId: serviceRequest.id,
        businessIds: input.businessIds,
        targetPrice: input.negotiation.targetPrice,
        maxPrice: input.negotiation.maxPrice,
        strategy: input.negotiation.strategy,
        notes: input.negotiation.notes,
        approvedAt: nowIso()
      });
    }

    for (const [index, business] of businesses.entries()) {
      try {
        const result = await startOutboundCall({
          request: serviceRequest,
          business,
          purpose: input.purpose,
          negotiationAllowed: input.purpose === "negotiation",
          targetPrice: input.negotiation?.targetPrice,
          maxPrice: input.negotiation?.maxPrice,
          negotiationNotes: input.negotiation?.notes
        });

        const call = await createCallAttempt({
          requestId: serviceRequest.id,
          businessId: business.id,
          purpose: input.purpose,
          status: result.status,
          provider: result.provider,
          conversationId: result.conversationId,
          callSid: result.callSid
        });

        if (result.provider === "demo") {
          const summary = buildDemoSummary(
            serviceRequest,
            business,
            call.id,
            input.purpose,
            index
          );
          await saveCallSummary(summary);
        }
      } catch (error) {
        const call = await createCallAttempt({
          requestId: serviceRequest.id,
          businessId: business.id,
          purpose: input.purpose,
          status: "failed",
          provider: shouldUseLiveCalls() ? "elevenlabs_twilio" : "demo",
          failureReason: error instanceof Error ? error.message : "Call failed."
        });
        await updateCallAttempt(call.id, {
          status: "failed",
          failureReason: error instanceof Error ? error.message : "Call failed."
        });
      }
    }

    const snapshot = await getSnapshot(serviceRequest.id);
    return ok({ snapshot, negotiation });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return badRequest(error);
    }
    return serverError(error);
  }
}
