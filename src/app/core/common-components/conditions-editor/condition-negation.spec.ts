import { applyNegation, splitNegation } from "./condition-negation";

describe("condition negation helpers", () => {
  it("should unwrap a negated fragment", () => {
    expect(splitNegation({ $not: { $in: ["C1"] } })).toEqual({
      negated: true,
      positive: { $in: ["C1"] },
    });
  });

  it("should pass a positive fragment through unchanged", () => {
    expect(splitNegation({ $in: ["C1"] })).toEqual({
      negated: false,
      positive: { $in: ["C1"] },
    });
  });

  it("should treat a plain value as positive", () => {
    expect(splitNegation("C1")).toEqual({ negated: false, positive: "C1" });
    expect(splitNegation(null)).toEqual({ negated: false, positive: null });
    expect(splitNegation(undefined)).toEqual({
      negated: false,
      positive: undefined,
    });
  });

  it("should not mistake an array for a negated fragment", () => {
    expect(splitNegation(["C1", "C2"])).toEqual({
      negated: false,
      positive: ["C1", "C2"],
    });
  });

  it("should round-trip a fragment through applyNegation", () => {
    const stored = applyNegation({ $in: ["C1"] }, true);

    expect(stored).toEqual({ $not: { $in: ["C1"] } });
    expect(splitNegation(stored)).toEqual({
      negated: true,
      positive: { $in: ["C1"] },
    });
  });

  it("should not wrap when not negated", () => {
    expect(applyNegation({ $in: ["C1"] }, false)).toEqual({ $in: ["C1"] });
  });
});
