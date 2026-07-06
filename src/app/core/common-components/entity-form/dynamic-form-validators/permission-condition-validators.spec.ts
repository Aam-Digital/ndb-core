import { FormControl } from "@angular/forms";
import {
  buildPermissionConditionValidator,
  describeConditionFragment,
} from "./permission-condition-validators";

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

    // an unconditional rule grants access regardless of the field value
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

    // inverted (cannot) rules are not translated into field validators
    expect(
      buildPermissionConditionValidator(
        [{ inverted: true, conditions: { language: "Bengali" } }],
        "language",
      ),
    ).toBeNull();
  });
});
