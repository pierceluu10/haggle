import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFallbackCallPlan } from "@/lib/call-plan";
import { buildDemoBusinesses, buildDemoSummary, demoIntake } from "@/lib/demo-data";

describe("demo mode data", () => {
  it("creates selected demo businesses for the request", () => {
    const businesses = buildDemoBusinesses("req_1");

    assert.equal(businesses.length, 3);
    assert.equal(businesses.every((business) => business.selected), true);
    assert.match(businesses[0].phone, /^\+1/);
  });

  it("creates transcript-backed quote summaries", () => {
    const intake = demoIntake();
    const request = {
      ...intake,
      id: "req_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft" as const,
      callPlan: buildFallbackCallPlan(intake)
    };
    const business = buildDemoBusinesses(request.id)[0];
    const summary = buildDemoSummary(request, business, "call_1", "inquiry", 0);

    assert.equal(summary.outcome, "quote_collected");
    assert.ok((summary.priceMin || 0) > 0);
    assert.match(summary.transcript, /AI assistant/);
  });
});
