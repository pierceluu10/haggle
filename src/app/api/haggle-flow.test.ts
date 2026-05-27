import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { POST as createRequest } from "@/app/api/requests/route";
import { POST as searchBusinesses } from "@/app/api/businesses/search/route";
import { POST as approveBusinesses } from "@/app/api/businesses/approve/route";
import { POST as startCalls } from "@/app/api/calls/route";
import { POST as recommend } from "@/app/api/recommendation/route";
import { demoIntake } from "@/lib/demo-data";
import { resetMemoryStoreForTests } from "@/lib/store";
import type { AppSnapshot, BusinessLead } from "@/lib/types";

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function payload<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

beforeEach(() => {
  process.env.DEMO_MODE = "true";
  resetMemoryStoreForTests();
});

describe("Haggle API flow", () => {
  it("runs the demo MVP path from intake to recommendation", async () => {
    const requestResponse = await createRequest(jsonRequest("/api/requests", demoIntake()));
    assert.equal(requestResponse.status, 200);
    const requestPayload = await payload<{ snapshot: AppSnapshot }>(requestResponse);
    const requestId = requestPayload.snapshot.request?.id;
    assert.ok(requestId);

    const searchResponse = await searchBusinesses(
      jsonRequest("/api/businesses/search", { requestId })
    );
    assert.equal(searchResponse.status, 200);
    const searchPayload = await payload<{ businesses: BusinessLead[] }>(searchResponse);
    assert.ok(searchPayload.businesses.length >= 3);

    const approveResponse = await approveBusinesses(
      jsonRequest("/api/businesses/approve", {
        requestId,
        businesses: searchPayload.businesses
      })
    );
    assert.equal(approveResponse.status, 200);
    const approved = await payload<{ snapshot: AppSnapshot }>(approveResponse);
    assert.equal(approved.snapshot.businesses.every((business) => business.selected), true);

    const callResponse = await startCalls(
      jsonRequest("/api/calls", {
        requestId,
        purpose: "inquiry",
        businessIds: approved.snapshot.businesses.map((business) => business.id)
      })
    );
    assert.equal(callResponse.status, 200);
    const called = await payload<{ snapshot: AppSnapshot }>(callResponse);
    assert.equal(called.snapshot.summaries.length, approved.snapshot.businesses.length);

    const recommendationResponse = await recommend(
      jsonRequest("/api/recommendation", { requestId })
    );
    assert.equal(recommendationResponse.status, 200);
    const recommended = await payload<{ snapshot: AppSnapshot }>(recommendationResponse);
    assert.match(recommended.snapshot.recommendation?.headline || "", /strongest option/);
  });

  it("rejects negotiation calls without approved limits", async () => {
    const requestResponse = await createRequest(jsonRequest("/api/requests", demoIntake()));
    const requestPayload = await payload<{ snapshot: AppSnapshot }>(requestResponse);
    const requestId = requestPayload.snapshot.request?.id;
    const businesses = await payload<{ businesses: BusinessLead[] }>(
      await searchBusinesses(jsonRequest("/api/businesses/search", { requestId }))
    );
    const approved = await payload<{ snapshot: AppSnapshot }>(
      await approveBusinesses(
        jsonRequest("/api/businesses/approve", {
          requestId,
          businesses: businesses.businesses
        })
      )
    );

    const response = await startCalls(
      jsonRequest("/api/calls", {
        requestId,
        purpose: "negotiation",
        businessIds: [approved.snapshot.businesses[0].id]
      })
    );

    assert.equal(response.status, 400);
  });
});
