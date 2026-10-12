import { DatabaseRule, ruleCoversAction } from "./permission-types";

describe("permission-types", () => {
  it.each<[string, DatabaseRule, boolean]>([
    ["exact subject and action", { subject: "Child", action: "read" }, true],
    [
      "manage covering any action",
      { subject: "Child", action: "manage" },
      true,
    ],
    [
      "action listed in an array",
      { subject: "Child", action: ["create", "read"] },
      true,
    ],
    ["grouped subject", { subject: ["School", "Child"], action: "read" }, true],
    ["wildcard subject", { subject: "all", action: "read" }, true],
    ["different entity type", { subject: "School", action: "read" }, false],
    ["different action", { subject: "Child", action: "create" }, false],
  ])("should detect a rule with %s", (_name, rule, expected) => {
    expect(ruleCoversAction(rule, "Child", "read")).toBe(expected);
  });

  it("should ignore conditions and inversion, which callers have to handle themselves", () => {
    const rule: DatabaseRule = {
      subject: "Child",
      action: "read",
      inverted: true,
      conditions: { category: "x" },
    };

    expect(ruleCoversAction(rule, "Child", "read")).toBe(true);
  });
});
