import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AppSnapshot,
  BusinessLead,
  CallAttempt,
  CallSummary,
  NegotiationInstruction,
  Recommendation,
  RequestStatus,
  ServiceRequest
} from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

type MemoryStore = {
  requests: Map<string, ServiceRequest>;
  businesses: Map<string, BusinessLead>;
  calls: Map<string, CallAttempt>;
  summaries: Map<string, CallSummary>;
  negotiations: Map<string, NegotiationInstruction>;
  recommendations: Map<string, Recommendation>;
};

type JsonRow<T> = {
  id?: string;
  request_id?: string;
  data?: T;
  request?: T;
  business?: T;
  call?: T;
  summary?: T;
  negotiation?: T;
  recommendation?: T;
};

const storeKey = "__haggle_memory_store__";

function memoryStore(): MemoryStore {
  const globalStore = globalThis as unknown as Record<string, MemoryStore | undefined>;

  if (!globalStore[storeKey]) {
    globalStore[storeKey] = {
      requests: new Map(),
      businesses: new Map(),
      calls: new Map(),
      summaries: new Map(),
      negotiations: new Map(),
      recommendations: new Map()
    };
  }

  return globalStore[storeKey];
}

function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || process.env.DEMO_MODE === "true") {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function fromRow<T>(row: JsonRow<T>, key: keyof JsonRow<T>): T {
  const value = row[key];
  if (!value) {
    throw new Error(`Missing ${String(key)} payload from store.`);
  }
  return value as T;
}

export async function createServiceRequest(
  input: Omit<ServiceRequest, "id" | "createdAt" | "updatedAt" | "status">
): Promise<ServiceRequest> {
  const createdAt = nowIso();
  const request: ServiceRequest = {
    ...input,
    id: createId("req"),
    createdAt,
    updatedAt: createdAt,
    status: "draft"
  };

  const client = supabase();
  if (client) {
    const { error } = await client.from("service_requests").upsert({
      id: request.id,
      request,
      created_at: request.createdAt,
      updated_at: request.updatedAt
    });
    if (error) throw error;
  } else {
    memoryStore().requests.set(request.id, request);
  }

  return request;
}

export async function getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("service_requests")
      .select("request")
      .eq("id", id)
      .maybeSingle<JsonRow<ServiceRequest>>();
    if (error) throw error;
    return data ? fromRow(data, "request") : undefined;
  }

  return memoryStore().requests.get(id);
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): Promise<ServiceRequest | undefined> {
  const request = await getServiceRequest(requestId);
  if (!request) {
    return undefined;
  }

  const updated = { ...request, status, updatedAt: nowIso() };
  const client = supabase();
  if (client) {
    const { error } = await client
      .from("service_requests")
      .update({ request: updated, updated_at: updated.updatedAt })
      .eq("id", requestId);
    if (error) throw error;
  } else {
    memoryStore().requests.set(requestId, updated);
  }

  return updated;
}

export async function saveBusinesses(
  requestId: string,
  businesses: BusinessLead[]
): Promise<BusinessLead[]> {
  const normalized = businesses.map((business) => ({
    ...business,
    requestId,
    id: business.id || createId("biz")
  }));

  const client = supabase();
  if (client) {
    const { error } = await client.from("business_leads").upsert(
      normalized.map((business) => ({
        id: business.id,
        request_id: requestId,
        business
      }))
    );
    if (error) throw error;
  } else {
    const store = memoryStore();
    for (const business of normalized) {
      store.businesses.set(business.id, business);
    }
  }

  await updateRequestStatus(requestId, "calls_ready");
  return normalized;
}

export async function getBusinesses(requestId: string): Promise<BusinessLead[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("business_leads")
      .select("business")
      .eq("request_id", requestId);
    if (error) throw error;
    return (data ?? []).map((row) => fromRow<BusinessLead>(row, "business"));
  }

  return [...memoryStore().businesses.values()].filter(
    (business) => business.requestId === requestId
  );
}

export async function getBusiness(id: string): Promise<BusinessLead | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("business_leads")
      .select("business")
      .eq("id", id)
      .maybeSingle<JsonRow<BusinessLead>>();
    if (error) throw error;
    return data ? fromRow(data, "business") : undefined;
  }

  return memoryStore().businesses.get(id);
}

export async function createCallAttempt(
  input: Omit<CallAttempt, "id" | "createdAt" | "updatedAt" | "retryCount">
): Promise<CallAttempt> {
  const createdAt = nowIso();
  const call: CallAttempt = {
    ...input,
    id: createId("call"),
    createdAt,
    updatedAt: createdAt,
    retryCount: 0
  };

  const client = supabase();
  if (client) {
    const { error } = await client.from("call_attempts").upsert({
      id: call.id,
      request_id: call.requestId,
      business_id: call.businessId,
      conversation_id: call.conversationId,
      call_sid: call.callSid,
      call
    });
    if (error) throw error;
  } else {
    memoryStore().calls.set(call.id, call);
  }

  await updateRequestStatus(call.requestId, call.purpose === "negotiation" ? "negotiating" : "calling");
  return call;
}

export async function updateCallAttempt(
  callId: string,
  patch: Partial<CallAttempt>
): Promise<CallAttempt | undefined> {
  const current = await getCallAttempt(callId);
  if (!current) {
    return undefined;
  }

  const call = { ...current, ...patch, updatedAt: nowIso() };
  const client = supabase();
  if (client) {
    const { error } = await client
      .from("call_attempts")
      .update({
        conversation_id: call.conversationId,
        call_sid: call.callSid,
        call
      })
      .eq("id", callId);
    if (error) throw error;
  } else {
    memoryStore().calls.set(callId, call);
  }

  return call;
}

export async function getCallAttempt(id: string): Promise<CallAttempt | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("call_attempts")
      .select("call")
      .eq("id", id)
      .maybeSingle<JsonRow<CallAttempt>>();
    if (error) throw error;
    return data ? fromRow(data, "call") : undefined;
  }

  return memoryStore().calls.get(id);
}

export async function getCallAttemptByProviderId(
  providerId: string
): Promise<CallAttempt | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("call_attempts")
      .select("call")
      .or(`conversation_id.eq.${providerId},call_sid.eq.${providerId}`)
      .maybeSingle<JsonRow<CallAttempt>>();
    if (error) throw error;
    return data ? fromRow(data, "call") : undefined;
  }

  return [...memoryStore().calls.values()].find(
    (call) => call.conversationId === providerId || call.callSid === providerId
  );
}

export async function getCalls(requestId: string): Promise<CallAttempt[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("call_attempts")
      .select("call")
      .eq("request_id", requestId);
    if (error) throw error;
    return (data ?? []).map((row) => fromRow<CallAttempt>(row, "call"));
  }

  return [...memoryStore().calls.values()].filter((call) => call.requestId === requestId);
}

export async function saveCallSummary(summary: CallSummary): Promise<CallSummary> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("call_summaries").upsert({
      id: summary.id,
      request_id: summary.requestId,
      business_id: summary.businessId,
      call_attempt_id: summary.callAttemptId,
      summary
    });
    if (error) throw error;
  } else {
    memoryStore().summaries.set(summary.id, summary);
  }

  await updateCallAttempt(summary.callAttemptId, { status: "completed" });
  await updateRequestStatus(summary.requestId, "summarized");
  return summary;
}

export async function getSummaries(requestId: string): Promise<CallSummary[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("call_summaries")
      .select("summary")
      .eq("request_id", requestId);
    if (error) throw error;
    return (data ?? []).map((row) => fromRow<CallSummary>(row, "summary"));
  }

  return [...memoryStore().summaries.values()].filter(
    (summary) => summary.requestId === requestId
  );
}

export async function saveNegotiation(
  negotiation: NegotiationInstruction
): Promise<NegotiationInstruction> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("negotiation_instructions").upsert({
      id: negotiation.id,
      request_id: negotiation.requestId,
      negotiation
    });
    if (error) throw error;
  } else {
    memoryStore().negotiations.set(negotiation.id, negotiation);
  }

  await updateRequestStatus(negotiation.requestId, "negotiating");
  return negotiation;
}

export async function getNegotiation(
  requestId: string
): Promise<NegotiationInstruction | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("negotiation_instructions")
      .select("negotiation")
      .eq("request_id", requestId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle<JsonRow<NegotiationInstruction>>();
    if (error) throw error;
    return data ? fromRow(data, "negotiation") : undefined;
  }

  return [...memoryStore().negotiations.values()]
    .filter((negotiation) => negotiation.requestId === requestId)
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))[0];
}

export async function saveRecommendation(
  recommendation: Recommendation
): Promise<Recommendation> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("recommendations").upsert({
      request_id: recommendation.requestId,
      recommendation
    });
    if (error) throw error;
  } else {
    memoryStore().recommendations.set(recommendation.requestId, recommendation);
  }

  await updateRequestStatus(recommendation.requestId, "recommended");
  return recommendation;
}

export async function getRecommendation(
  requestId: string
): Promise<Recommendation | undefined> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("recommendations")
      .select("recommendation")
      .eq("request_id", requestId)
      .maybeSingle<JsonRow<Recommendation>>();
    if (error) throw error;
    return data ? fromRow(data, "recommendation") : undefined;
  }

  return memoryStore().recommendations.get(requestId);
}

export async function getSnapshot(requestId: string): Promise<AppSnapshot> {
  return {
    request: await getServiceRequest(requestId),
    businesses: await getBusinesses(requestId),
    calls: await getCalls(requestId),
    summaries: await getSummaries(requestId),
    recommendation: await getRecommendation(requestId),
    negotiation: await getNegotiation(requestId)
  };
}

export function resetMemoryStoreForTests(): void {
  const store = memoryStore();
  store.requests.clear();
  store.businesses.clear();
  store.calls.clear();
  store.summaries.clear();
  store.negotiations.clear();
  store.recommendations.clear();
}
