import { negate, splitNegation, withSameNegation } from "./condition-negation";
import { permissionConditionsMatcher } from "../../permissions/ability/entity-ability";

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

  it("should round-trip a fragment through negate", () => {
    const stored = negate({ $in: ["C1"] });

    expect(stored).toEqual({ $not: { $in: ["C1"] } });
    expect(splitNegation(stored)).toEqual({
      negated: true,
      positive: { $in: ["C1"] },
    });
  });

  describe("fragments the matcher can actually evaluate", () => {
    // the editor's output has to compile with the same matcher that later
    // evaluates it - a fragment it rejects is dropped as an unusable rule,
    // which silently grants nothing
    const compiles = (conditions: any) => {
      try {
        permissionConditionsMatcher(conditions);
        return true;
      } catch {
        return false;
      }
    };

    it.each([
      ["a string", "Ann"],
      ["a number", 10],
      ["a boolean", true],
      ["null", null],
      ["an $in fragment", { $in: ["C1"] }],
      ["an $elemMatch fragment", { $elemMatch: { $in: ["a"] } }],
    ])("should negate %s into an evaluable condition", (_label, value) => {
      expect(compiles({ field: negate(value) })).toBe(true);
    });

    it("should keep a negated scalar meaning the same as the positive one", () => {
      expect(
        compiles({ field: withSameNegation({ $not: { $eq: "x" } }, "Ann") }),
      ).toBe(true);
    });
  });

  it("should carry a previous fragment's negation onto a new value", () => {
    expect(withSameNegation({ $not: { $eq: "Ann" } }, "Bob")).toEqual({
      $not: { $eq: "Bob" },
    });
  });

  it("should leave a new value positive when the previous was not negated", () => {
    expect(withSameNegation("Ann", "Bob")).toBe("Bob");
  });
});
