import type { CallRole } from "@/lib/demo-call";

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export function shouldUseLiveCalls(): boolean {
  return (
    !isDemoMode() &&
    Boolean(process.env.ELEVENLABS_API_KEY) &&
    Boolean(
      process.env.ELEVENLABS_AGENT_ID ||
        process.env.ELEVENLABS_INQUIRY_AGENT_ID ||
        process.env.ELEVENLABS_NEGOTIATION_AGENT_ID
    ) &&
    Boolean(process.env.ELEVENLABS_PHONE_NUMBER_ID)
  );
}

export function resolveAgentId(role: CallRole = "inquiry"): string | undefined {
  if (role === "negotiation") {
    return (
      process.env.ELEVENLABS_NEGOTIATION_AGENT_ID ||
      process.env.ELEVENLABS_AGENT_ID
    );
  }

  return (
    process.env.ELEVENLABS_INQUIRY_AGENT_ID ||
    process.env.ELEVENLABS_AGENT_ID ||
    process.env.ELEVENLABS_NEGOTIATION_AGENT_ID
  );
}
