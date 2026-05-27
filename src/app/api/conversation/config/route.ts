import { ok } from "@/lib/http";
import { resolveAgentId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const conciergeAgentId = resolveAgentId("inquiry");
  const negotiatorAgentId = resolveAgentId("negotiation");

  return ok({
    liveConcierge: Boolean(process.env.ELEVENLABS_API_KEY && conciergeAgentId),
    conciergeAgentId: conciergeAgentId || null,
    liveCalls: Boolean(
      process.env.ELEVENLABS_API_KEY &&
        negotiatorAgentId &&
        process.env.ELEVENLABS_PHONE_NUMBER_ID
    ),
    demoMode: process.env.DEMO_MODE !== "false"
  });
}
