import OpenAI from "openai";
import { buildFallbackCallPlan } from "@/lib/call-plan";
import type {
  BusinessLead,
  CallPlan,
  CallPurpose,
  CallSummary,
  IntakeInput,
  Recommendation,
  ServiceRequest
} from "@/lib/types";
import { createId, nowIso, parseMoneyRange, shouldUseLiveAi } from "@/lib/utils";

type JsonSchema = {
  type: "object";
  additionalProperties: boolean;
  required: string[];
  properties: Record<string, unknown>;
};

const callPlanSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["opening", "questions", "summaryGoals", "negotiationGuardrails"],
  properties: {
    opening: { type: "string" },
    questions: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
    summaryGoals: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
    negotiationGuardrails: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 }
  }
};

const summarySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "priceText",
    "availability",
    "timeline",
    "serviceNotes",
    "missingInfo",
    "confidence",
    "outcome"
  ],
  properties: {
    summary: { type: "string" },
    priceText: { type: "string" },
    availability: { type: "string" },
    timeline: { type: "string" },
    serviceNotes: { type: "string" },
    missingInfo: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    outcome: {
      type: "string",
      enum: ["quote_collected", "voicemail", "unavailable", "needs_follow_up"]
    }
  }
};

const recommendationSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["bestBusinessId", "headline", "rationale", "tradeoffs", "nextSteps"],
  properties: {
    bestBusinessId: { type: "string" },
    headline: { type: "string" },
    rationale: { type: "string" },
    tradeoffs: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    nextSteps: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 }
  }
};

function openaiClient(): OpenAI | null {
  if (!shouldUseLiveAi()) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function structuredJson<T>(
  name: string,
  schema: JsonSchema,
  input: string
): Promise<T | undefined> {
  const client = openaiClient();
  if (!client) {
    return undefined;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  try {
    const response = await (client as unknown as {
      responses: {
        create: (body: unknown) => Promise<{ output_text?: string }>;
      };
    }).responses.create({
      model,
      input,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema
        }
      }
    });

    if (!response.output_text) {
      return undefined;
    }

    return JSON.parse(response.output_text) as T;
  } catch (error) {
    console.warn(`OpenAI ${name} generation failed; using fallback.`, error);
    return undefined;
  }
}

export async function generateCallPlan(input: IntakeInput): Promise<CallPlan> {
  const generated = await structuredJson<CallPlan>(
    "haggle_call_plan",
    callPlanSchema,
    [
      "Create a concise outbound call plan for an AI assistant.",
      "The assistant must clearly introduce itself as AI and must not negotiate unless later approved.",
      `Service request: ${JSON.stringify(input)}`
    ].join("\n")
  );

  return generated ?? buildFallbackCallPlan(input);
}

export async function summarizeTranscript(params: {
  request: ServiceRequest;
  business: BusinessLead;
  callAttemptId: string;
  purpose: CallPurpose;
  transcript: string;
  transcriptSummary?: string;
}): Promise<CallSummary> {
  const generated = await structuredJson<Omit<
    CallSummary,
    "id" | "requestId" | "businessId" | "callAttemptId" | "purpose" | "transcript" | "createdAt"
  >>(
    "haggle_call_summary",
    summarySchema,
    [
      "Extract only details supported by the call transcript. Use missingInfo for unknowns.",
      `Request: ${JSON.stringify(params.request)}`,
      `Business: ${JSON.stringify(params.business)}`,
      `Purpose: ${params.purpose}`,
      `Transcript summary from provider: ${params.transcriptSummary || "none"}`,
      `Transcript: ${params.transcript}`
    ].join("\n")
  );

  const fallbackSummary =
    params.transcriptSummary ||
    `${params.business.name} was contacted. Review the transcript for exact details.`;
  const priceText = generated?.priceText || "Not provided";
  const range = parseMoneyRange(priceText);

  return {
    id: createId("sum"),
    requestId: params.request.id,
    businessId: params.business.id,
    callAttemptId: params.callAttemptId,
    purpose: params.purpose,
    transcript: params.transcript,
    summary: generated?.summary || fallbackSummary,
    priceText,
    availability: generated?.availability || "Not provided",
    timeline: generated?.timeline || "Not provided",
    serviceNotes: generated?.serviceNotes || "No additional service notes captured.",
    missingInfo: generated?.missingInfo?.length ? generated.missingInfo : ["Exact quote details"],
    confidence: generated?.confidence || "medium",
    outcome: generated?.outcome || "needs_follow_up",
    createdAt: nowIso(),
    ...range
  };
}

export async function generateRecommendation(params: {
  request: ServiceRequest;
  businesses: BusinessLead[];
  summaries: CallSummary[];
}): Promise<Recommendation> {
  const completedSummaries = params.summaries.filter(
    (summary) => summary.outcome === "quote_collected"
  );
  const sorted = [...completedSummaries].sort((a, b) => {
    const aPrice = a.priceMin ?? a.priceMax ?? Number.POSITIVE_INFINITY;
    const bPrice = b.priceMin ?? b.priceMax ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  });
  const fallbackBest = sorted[0];

  const generated = await structuredJson<Omit<Recommendation, "requestId" | "generatedAt">>(
    "haggle_recommendation",
    recommendationSchema,
    [
      "Recommend the best business for the user. Prefer value, availability, and confidence over price alone.",
      `Request: ${JSON.stringify(params.request)}`,
      `Businesses: ${JSON.stringify(params.businesses)}`,
      `Summaries: ${JSON.stringify(params.summaries)}`
    ].join("\n")
  );

  if (generated) {
    return {
      ...generated,
      bestBusinessId: generated.bestBusinessId || fallbackBest?.businessId,
      requestId: params.request.id,
      generatedAt: nowIso()
    };
  }

  const bestBusiness = params.businesses.find(
    (business) => business.id === fallbackBest?.businessId
  );

  return {
    requestId: params.request.id,
    bestBusinessId: bestBusiness?.id,
    headline: bestBusiness
      ? `${bestBusiness.name} is the strongest option right now.`
      : "More call results are needed before choosing a provider.",
    rationale: fallbackBest
      ? `${fallbackBest.summary} The quote was captured with ${fallbackBest.confidence} confidence.`
      : "No completed quote calls are available yet.",
    tradeoffs: fallbackBest?.missingInfo?.length
      ? fallbackBest.missingInfo
      : ["Final cost can still change after inspection."],
    nextSteps: bestBusiness
      ? [`Approve negotiation or contact ${bestBusiness.name} to book the quoted window.`]
      : ["Run at least one inquiry call, then regenerate the recommendation."],
    generatedAt: nowIso()
  };
}
