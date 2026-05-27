import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_CONTACTS } from "@/lib/contacts";
import {
  parseCallTarget,
  parseShowDealerships,
  resolveCallRole,
  resolveVoiceAction
} from "@/lib/parse-intent";

describe("parseCallTarget", () => {
  it("resolves the third contact when user asks to call", () => {
    const target = parseCallTarget("Please call the third number", DEMO_CONTACTS);
    assert.equal(target?.id, "contact-3");
    assert.equal(target?.phone, "+16472616387");
  });

  it("does not resolve third without a call intent", () => {
    const target = parseCallTarget("the third dealership looks good", DEMO_CONTACTS);
    assert.equal(target, undefined);
  });
});

describe("dealership flow", () => {
  it("detects pull up dealerships", () => {
    assert.equal(
      parseShowDealerships("Can you pull up local car dealerships"),
      true
    );
  });

  it("ignores casual dealer mention", () => {
    assert.equal(parseShowDealerships("I like that honda dealer"), false);
  });

  it("shows dealers without a call action", () => {
    const action = resolveVoiceAction(
      "Pull up local car dealerships near me",
      DEMO_CONTACTS
    );
    assert.equal(action.type, "show_dealers");
  });

  it("uses negotiator for call the third number", () => {
    const action = resolveVoiceAction("Call the third number", DEMO_CONTACTS);
    assert.equal(action.type, "call");
    if (action.type === "call") {
      assert.equal(action.target.id, "contact-3");
      assert.equal(action.role, "negotiation");
    }
  });
});
