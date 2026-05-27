import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidPhoneNumber, normalizePhoneNumber, parseMoneyRange } from "@/lib/utils";

describe("phone helpers", () => {
  it("normalizes North American numbers to E.164", () => {
    assert.equal(normalizePhoneNumber("(905) 555-0114"), "+19055550114");
    assert.equal(normalizePhoneNumber("1-905-555-0114"), "+19055550114");
  });

  it("validates E.164-compatible phone numbers", () => {
    assert.equal(isValidPhoneNumber("+19055550114"), true);
    assert.equal(isValidPhoneNumber("555"), false);
  });
});

describe("money parsing", () => {
  it("extracts price ranges from natural-language quote text", () => {
    assert.deepEqual(parseMoneyRange("$220-$320 total"), { priceMin: 220, priceMax: 320 });
    assert.deepEqual(parseMoneyRange("No firm price"), {});
  });
});
