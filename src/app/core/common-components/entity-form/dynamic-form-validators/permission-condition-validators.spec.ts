import { FormControl } from "@angular/forms";
import {
  buildPermissionConditionValidator,
  describeConditionFragment,
} from "./permission-condition-validators";

/*
 * The rules passed in are the pre-filtered result of `ability.rulesFor(action, entityType)`,
 * i.e. all rules here apply to the tested entity type and action anyway.
 * Only the `conditions` (and `inverted` flag) of a rule are relevant for the validator,
 * so the fixtures omit the `subject` / `action` properties of real rules.
 */
describe("buildPermissionConditionValidator", () => {
  it("should flag values (incl. empty) not matching an equality condition and pass matching ones", () => {
    const validator = buildPermissionConditionValidator(
      [{ conditions: { language: "Bengali" } }],
      "language",
    );

    expect(validator(new FormControl("Bengali"))).toBeNull();

    const mismatch = validator(new FormControl("English"));
    expect(mismatch.permissionCondition.errorMessage).toContain("Bengali");

    expect(validator(new FormControl(undefined))).not.toBeNull();
    expect(validator(new FormControl(null))).not.toBeNull();
  });

  it("should pass if the value satisfies any of several alternative rules", () => {
    const validator = buildPermissionConditionValidator(
      [
        { conditions: { language: "Bengali" } },
        { conditions: { language: "Hindi" } },
      ],
      "language",
    );

    expect(validator(new FormControl("Hindi"))).toBeNull();
    expect(validator(new FormControl("English"))).not.toBeNull();
  });

  it("should format values in the error message with the given formatValue lookup", () => {
    const toLabel = (value) => ({ M: "Male", F: "Female" })[value] ?? value;
    const validator = buildPermissionConditionValidator(
      [{ conditions: { gender: { $in: ["M", "F"] } } }],
      "gender",
      undefined,
      toLabel,
    );

    const result = validator(new FormControl("X"));
    expect(result.permissionCondition.errorMessage).toContain("Male, Female");

    expect(describeConditionFragment("M", toLabel)).toBe("Male");
    expect(describeConditionFragment(["M", "F"], toLabel)).toBe("Male, Female");
    expect(describeConditionFragment({ $eq: "F" }, toLabel)).toBe("Female");
  });

  it("should not create a validator if the field is not restricted for every granting rule", () => {
    // no rules at all
    expect(buildPermissionConditionValidator([], "language")).toBeNull();

    // {} = rule without any "conditions" (e.g. a plain "can manage School" rule),
    // which grants access regardless of the field value
    expect(
      buildPermissionConditionValidator(
        [{ conditions: { language: "Bengali" } }, {}],
        "language",
      ),
    ).toBeNull();

    // a rule constraining only other fields can still grant with any value here
    expect(
      buildPermissionConditionValidator(
        [
          { conditions: { language: "Bengali" } },
          { conditions: { name: "x" } },
        ],
        "language",
      ),
    ).toBeNull();

    // a lone inverted rule without any granting rule: the action is denied
    // as a whole (form is disabled elsewhere), no field validator needed
    expect(
      buildPermissionConditionValidator(
        [{ inverted: true, conditions: { language: "Bengali" } }],
        "language",
      ),
    ).toBeNull();

    // inverted rules with multi-field conditions cannot be decided by a
    // single field's value and are left to the save-time permission check
    expect(
      buildPermissionConditionValidator(
        [
          { inverted: true, conditions: { language: "Bengali", name: "x" } },
          {},
        ],
        "language",
      ),
    ).toBeNull();
  });

  it("should flag values denied by a single-field inverted (cannot) rule", () => {
    // priority order as returned by `ability.rulesFor`: first matching rule wins
    const validator = buildPermissionConditionValidator(
      [{ inverted: true, conditions: { center: "BERLIN" } }, {}],
      "center",
    );

    const denied = validator(new FormControl("BERLIN"));
    expect(denied.permissionCondition.errorMessage).toContain("BERLIN");

    expect(validator(new FormControl("OTHER"))).toBeNull();
    // an empty value is not denied by a "cannot ... BERLIN" rule
    expect(validator(new FormControl(undefined))).toBeNull();
  });

  it("should respect rule priority when granting and inverted rules overlap", () => {
    // a higher-priority granting rule wins over a later inverted rule
    const validator = buildPermissionConditionValidator(
      [
        { conditions: { center: "BERLIN" } },
        { inverted: true, conditions: { center: "BERLIN" } },
      ],
      "center",
    );
    expect(validator(new FormControl("BERLIN"))).toBeNull();

    // combined with restricted granting rules, both limits apply
    const combined = buildPermissionConditionValidator(
      [
        { inverted: true, conditions: { language: "Hindi" } },
        { conditions: { language: { $in: ["Bengali", "Hindi"] } } },
      ],
      "language",
    );
    expect(combined(new FormControl("Bengali"))).toBeNull();
    const deniedByInverted = combined(new FormControl("Hindi"));
    expect(deniedByInverted.permissionCondition.errorMessage).toContain(
      "Hindi",
    );
    const outsideAllowed = combined(new FormControl("English"));
    expect(outsideAllowed.permissionCondition.errorMessage).toContain(
      "Bengali",
    );
  });
});
