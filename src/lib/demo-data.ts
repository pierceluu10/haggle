import type {
  BusinessLead,
  CallPurpose,
  CallSummary,
  IntakeInput,
  ServiceRequest
} from "@/lib/types";
import { createId, nowIso, parseMoneyRange } from "@/lib/utils";

const demoBusinesses = [
  {
    name: "Durham Rapid Plumbing",
    phone: "+19055550114",
    address: "88 Bond St W, Oshawa, ON",
    contactName: "Maya",
    rating: 4.7,
    notes: "Strong same-week availability"
  },
  {
    name: "Lakeview Pipe & Drain",
    phone: "+19055550182",
    address: "214 King St E, Oshawa, ON",
    contactName: "Andre",
    rating: 4.5,
    notes: "Best diagnostic fee"
  },
  {
    name: "North End Home Services",
    phone: "+19055550177",
    address: "121 Taunton Rd E, Oshawa, ON",
    contactName: "Sam",
    rating: 4.3,
    notes: "Can bundle faucet parts if needed"
  }
];

const inquirySummaries = [
  {
    priceText: "$135 call-out fee, likely $220-$320 total if it is a basic under-sink leak.",
    availability: "Tomorrow afternoon or Friday morning.",
    timeline: "Can usually finish same day if no specialty part is required.",
    serviceNotes:
      "Asked for a photo of the leak area before dispatch. Fee is applied to the repair if work proceeds.",
    summary:
      "Durham Rapid Plumbing can come quickly and gave the clearest estimate. They will apply the call-out fee toward the repair."
  },
  {
    priceText: "$95 diagnostic fee, repair commonly lands around $240-$380 depending on parts.",
    availability: "Friday after 2 PM or Monday morning.",
    timeline: "Most sink leaks are fixed in one visit.",
    serviceNotes:
      "Lower upfront diagnostic cost, but final total depends on whether the trap or supply line needs replacement.",
    summary:
      "Lakeview Pipe & Drain offered the lowest diagnostic fee and a reasonable repair range, with slightly later availability."
  },
  {
    priceText: "$175 minimum visit fee, total could be $300-$450.",
    availability: "Next Tuesday.",
    timeline: "One visit if parts are standard.",
    serviceNotes:
      "They are busier this week and could not commit to an earlier appointment without an emergency surcharge.",
    summary:
      "North End Home Services is viable but slower and likely more expensive for this request."
  }
];

export function buildDemoBusinesses(requestId: string): BusinessLead[] {
  return demoBusinesses.map((business) => ({
    id: createId("biz"),
    requestId,
    source: "demo",
    selected: true,
    ...business
  }));
}

export function demoTranscriptFor(businessName: string, purpose: CallPurpose): string {
  if (purpose === "negotiation") {
    return `AI assistant: I am calling back on behalf of the customer. They liked your quote, but they are trying to stay within budget. Is there any flexibility on the fee or timing? ${businessName}: We can waive part of the diagnostic fee if they book tomorrow, bringing the expected total down by about $35.`;
  }

  return `AI assistant: I am calling on behalf of a customer with a leaking sink in Oshawa this week. Could I ask about pricing and availability? ${businessName}: We service Oshawa. For a basic leak, pricing depends on parts, but we can share a rough estimate and available appointment windows.`;
}

export function buildDemoSummary(
  request: ServiceRequest,
  business: BusinessLead,
  callAttemptId: string,
  purpose: CallPurpose,
  index: number
): CallSummary {
  const createdAt = nowIso();

  if (purpose === "negotiation") {
    const priceText =
      index === 0
        ? "$100 call-out fee, likely $185-$285 total after a courtesy discount."
        : "$95 diagnostic fee remains, but they can include a basic washer replacement if needed.";
    const range = parseMoneyRange(priceText);

    return {
      id: createId("sum"),
      requestId: request.id,
      businessId: business.id,
      callAttemptId,
      purpose,
      transcript: demoTranscriptFor(business.name, purpose),
      summary:
        index === 0
          ? `${business.name} agreed to reduce the call-out fee if the user books the earlier appointment.`
          : `${business.name} held price but offered a small service inclusion if the repair is straightforward.`,
      priceText,
      availability: index === 0 ? "Tomorrow afternoon still available." : "Friday after 2 PM.",
      timeline: "Expected same-day completion.",
      serviceNotes: "Negotiation stayed within the approved budget and did not commit the user to booking.",
      missingInfo: ["Final price still depends on inspection."],
      confidence: "high",
      outcome: "quote_collected",
      createdAt,
      ...range
    };
  }

  const source = inquirySummaries[index % inquirySummaries.length];
  const range = parseMoneyRange(source.priceText);

  return {
    id: createId("sum"),
    requestId: request.id,
    businessId: business.id,
    callAttemptId,
    purpose,
    transcript: demoTranscriptFor(business.name, purpose),
    summary: source.summary,
    priceText: source.priceText,
    availability: source.availability,
    timeline: source.timeline,
    serviceNotes: source.serviceNotes,
    missingInfo: ["Exact repair cost requires inspection."],
    confidence: "high",
    outcome: "quote_collected",
    createdAt,
    ...range
  };
}

export function demoIntake(): IntakeInput {
  return {
    description: "I need a plumber to fix a leaking sink in Oshawa this week.",
    serviceType: "Plumber",
    location: "Oshawa, ON",
    budget: "$350 max if possible",
    timeline: "Within the next week",
    preferences: "Earlier appointments and transparent call-out fees.",
    dealbreakers: "No emergency surcharge unless approved first.",
    urgency: "normal"
  };
}
