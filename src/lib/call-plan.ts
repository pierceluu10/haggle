import type { CallPlan, IntakeInput } from "@/lib/types";

export function buildFallbackCallPlan(input: IntakeInput): CallPlan {
  const service = input.serviceType || "service";
  const location = input.location || "the user's area";

  return {
    opening: `Hi, I am an AI assistant calling on behalf of a customer looking for ${service} in ${location}. I will keep this brief and can take a rough estimate.`,
    questions: [
      "Do you service this location?",
      "What is your earliest availability?",
      "What price range or call-out fee should the customer expect?",
      "What information do you need before confirming the job?",
      "Are there any conditions, travel fees, or minimum charges?"
    ],
    summaryGoals: [
      "Collect price or price range",
      "Collect earliest availability",
      "Note service requirements and next steps",
      "Capture uncertainty instead of guessing"
    ],
    negotiationGuardrails: [
      "Do not negotiate unless the user has approved negotiation mode.",
      "Do not agree to anything above the user's approved maximum.",
      "Ask for a lower fee, earlier appointment, or waived call-out fee when appropriate.",
      "End politely if the provider will not discuss pricing."
    ]
  };
}
