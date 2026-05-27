import type { CallRecord, CallResult } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

const calls = new Map<string, CallRecord>();
const byProviderId = new Map<string, string>();

export function createCallRecord(params: {
  contactId: string;
  contactName: string;
  contactPhone: string;
  conversationId?: string;
  callSid?: string;
  role?: CallRecord["role"];
}): CallRecord {
  const record: CallRecord = {
    id: createId("call"),
    contactId: params.contactId,
    contactName: params.contactName,
    contactPhone: params.contactPhone,
    role: params.role,
    status: "calling",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    conversationId: params.conversationId,
    callSid: params.callSid
  };

  calls.set(record.id, record);
  if (params.conversationId) {
    byProviderId.set(params.conversationId, record.id);
  }
  if (params.callSid) {
    byProviderId.set(params.callSid, record.id);
  }

  return record;
}

export function getCallRecord(id: string): CallRecord | undefined {
  return calls.get(id);
}

export function getCallByProviderId(providerId: string): CallRecord | undefined {
  const callId = byProviderId.get(providerId);
  return callId ? calls.get(callId) : undefined;
}

export function completeCallRecord(id: string, result: CallResult): CallRecord | undefined {
  const record = calls.get(id);
  if (!record) {
    return undefined;
  }

  record.status = "completed";
  record.result = result;
  record.updatedAt = nowIso();
  return record;
}

export function failCallRecord(id: string, reason: string): CallRecord | undefined {
  const record = calls.get(id);
  if (!record) {
    return undefined;
  }

  record.status = "failed";
  record.failureReason = reason;
  record.updatedAt = nowIso();
  return record;
}

export function resetCallStoreForTests(): void {
  calls.clear();
  byProviderId.clear();
}
