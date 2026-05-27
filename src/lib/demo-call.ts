import type { DemoContact } from "@/lib/contacts";
import type { CallResult, CallRole } from "@/lib/types";

export type { CallRole };

const DEMO_RESULTS: Record<string, Omit<CallResult, "transcript">> = {
  "contact-1": {
    summary:
      "Durham Rapid Plumbing answered. They can do a same-week visit and quoted a clear call-out fee.",
    priceText: "$135 call-out, roughly $220–$320 if it is a basic under-sink leak.",
    availability: "Tomorrow afternoon or Friday morning.",
    timeline: "Usually finished same day if no specialty part is needed.",
    serviceNotes: "Asked for a photo of the leak before dispatch.",
    confidence: "high"
  },
  "contact-2": {
    summary:
      "Lakeview Pipe & Drain gave a lower diagnostic fee with a slightly later window.",
    priceText: "$95 diagnostic, repair commonly $240–$380 depending on parts.",
    availability: "Friday after 2 PM or Monday morning.",
    timeline: "Most sink leaks are fixed in one visit.",
    serviceNotes: "Final total depends on trap vs supply line replacement.",
    confidence: "medium"
  },
  "contact-3": {
    summary:
      "Your demo line picked up. Haggle AI confirmed the outbound call path is working end to end.",
    priceText: "Demo quote: $199 flat for inspection + first hour.",
    availability: "Anytime this week for the hackathon demo.",
    timeline: "Immediate — this is your live test number.",
    serviceNotes: "Use this line to verify ElevenLabs outbound + webhook flow.",
    confidence: "high"
  }
};

const HONDA_NEGOTIATION: Omit<CallResult, "transcript"> = {
  summary:
    "Negotiator closed on a Honda Civic Type R at $31,000 OTD. The desk was firm at first, then matched the other dealer.",
  priceText: "$31,000 out the door (was asking ~$34,500).",
  availability: "Paperwork ready this week if you want to lock it in.",
  timeline: "Held the price through end of day after matching the competitor quote.",
  serviceNotes:
    "They wouldn't budge until we cited the other store's offer; then they met it on the Type R.",
  confidence: "high"
};

export function buildHondaNegotiationDemoResult(contact: DemoContact): CallResult {
  return {
    ...HONDA_NEGOTIATION,
    transcript: [
      "Negotiator: I'm calling back about the Civic Type R — my buyer has a written offer elsewhere.",
      `${contact.name}: We're pretty firm at $34,500 out the door on that unit.`,
      "Negotiator: The other dealer is at $31,000 OTD. Can you match to keep the sale today?",
      `${contact.name}: …Give me a minute. Okay — we can do $31,000 if you're ready to move forward.`
    ].join("\n")
  };
}

export function buildDemoCallResult(
  contact: DemoContact,
  role: CallRole = "inquiry"
): CallResult {
  if (role === "negotiation" && contact.id === "contact-3") {
    return buildHondaNegotiationDemoResult(contact);
  }

  const preset = DEMO_RESULTS[contact.id] ?? DEMO_RESULTS["contact-3"];

  return {
    ...preset,
    transcript: [
      role === "negotiation"
        ? `Negotiator: Following up to see if there's any flexibility on price for my customer.`
        : `Concierge: Hi, I'm Haggle AI calling on behalf of a customer about a service quote.`,
      `${contact.name}: Thanks for calling — we can help with that.`,
      role === "negotiation"
        ? `Negotiator: Another provider came in lower — any room to match?`
        : `Concierge: What's your earliest availability and a rough price range?`,
      `${contact.name}: ${preset.availability} ${preset.priceText}`
    ].join("\n")
  };
}
