import { ok, serverError } from "@/lib/http";
import { resolveAgentId } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const agentId = resolveAgentId("inquiry");
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey || !agentId) {
      return Response.json(
        { enabled: false, error: "Missing ELEVENLABS_API_KEY or concierge agent ID." },
        { status: 503 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { "xi-api-key": apiKey }
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`ElevenLabs signed URL failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { signed_url: string };
    return ok({ enabled: true, signedUrl: payload.signed_url });
  } catch (error) {
    return serverError(error);
  }
}
