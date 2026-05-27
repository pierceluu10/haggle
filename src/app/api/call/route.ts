import { getContactById } from "@/lib/contacts";
import {
  completeCallRecord,
  createCallRecord
} from "@/lib/call-store";
import { buildDemoCallResult, type CallRole } from "@/lib/demo-call";
import { startOutboundCall } from "@/lib/elevenlabs";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { isDemoMode, shouldUseLiveCalls } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const callSchema = z.object({
  contactId: z.string().min(1),
  userMessage: z.string().trim().optional(),
  role: z.enum(["inquiry", "negotiation"]).default("inquiry")
});

export async function POST(request: Request) {
  try {
    const input = callSchema.parse(await request.json());
    const contact = getContactById(input.contactId);

    if (!contact) {
      return notFound("Contact not found.");
    }

    const role = input.role as CallRole;
    const live = shouldUseLiveCalls();

    if (role === "negotiation" && !live) {
      const record = createCallRecord({
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        role
      });
      return ok({
        call: record,
        live: false,
        demoMode: isDemoMode(),
        hint:
          "Outbound calls are disabled. Set DEMO_MODE=false and add ElevenLabs phone + negotiator agent IDs in .env.local."
      });
    }

    const outbound = await startOutboundCall({
      contact,
      userMessage: input.userMessage,
      role
    });

    const record = createCallRecord({
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      conversationId: outbound.conversationId,
      callSid: outbound.callSid,
      role
    });

    if (outbound.provider === "demo" || outbound.status === "completed") {
      if (role === "negotiation") {
        return ok({ call: record, live: false, demoMode: isDemoMode() });
      }
      const completed = completeCallRecord(record.id, buildDemoCallResult(contact, role));
      return ok({ call: completed, live: false, demoMode: isDemoMode(), role });
    }

    return ok({
      call: record,
      live: true,
      demoMode: false,
      role,
      hint: `Ringing ${contact.displayPhone} via ElevenLabs negotiator.`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error);
    }
    console.error("Outbound call failed:", error);
    return serverError(error);
  }
}
