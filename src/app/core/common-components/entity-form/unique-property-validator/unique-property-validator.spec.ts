import { waitForAsync } from "@angular/core/testing";
import { uniquePropertyValidator } from "./unique-property-validator";
import { AsyncValidatorFn, FormControl } from "@angular/forms";
import { DEFAULT_LANGUAGE } from "../../../language/language-statics";

describe("UniquePropertyValidator", () => {
  let validator: AsyncValidatorFn;
  let formControl: FormControl;
  let demoValues: string[];

  beforeEach(waitForAsync(() => {
    demoValues = ["value1", "value2", "value3"];
    formControl = new FormControl();
    validator = uniquePropertyValidator({
      getExistingValues: async () => demoValues,
      normalize: false,
      fieldLabel: "id",
    });
  }));

  it("should validate new value", async () => {
    formControl.setValue("new value");
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toBeNull();
  });

  it("should disallow already existing value", async () => {
    formControl.setValue(demoValues[1]);
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ uniqueProperty: expect.any(String) });
  });

  it("should allow to keep unchanged value (to not refuse saving an existing entity with unchanged value)", async () => {
    formControl = new FormControl(demoValues[1], { nonNullable: true });
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(formControl.pristine).toBe(false);
    expect(validationResult).toBeNull();
  });

  it("should work with normalization (case-insensitive)", async () => {
    validator = uniquePropertyValidator({
      getExistingValues: async () => ["Existing Label", "Another Label"],
      normalize: true,
      fieldLabel: "label",
    });

    formControl.setValue("existing label"); // lowercase
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ uniqueProperty: expect.any(String) });
  });

  it("should compare multi-lingual texts by the active language, not as raw maps", async () => {
    validator = uniquePropertyValidator({
      getExistingValues: async () => [
        { [DEFAULT_LANGUAGE]: "Existing Label", de: "Vorhandenes Label" },
      ],
      normalize: true,
      fieldLabel: "label",
    });

    // a different map holding the same text of the active language is a duplicate
    formControl.setValue({ [DEFAULT_LANGUAGE]: "existing label" });
    expect(await validator(formControl)).toEqual({
      uniqueProperty: expect.any(String),
    });

    formControl.setValue({ [DEFAULT_LANGUAGE]: "Another Label" });
    expect(await validator(formControl)).toBeNull();
  });

  it("should allow keeping unchanged value via defaultValue", async () => {
    validator = uniquePropertyValidator({
      getExistingValues: async () => ["Existing Label", "Another Label"],
      normalize: true,
      fieldLabel: "label",
    });

    // A control initialized with "Existing Label" should allow keeping it (defaultValue match)
    formControl = new FormControl("Existing Label", { nonNullable: true });
    formControl.markAsDirty();
    let validationResult = await validator(formControl);
    expect(validationResult).toBeNull();

    // Should still reject other duplicates
    formControl.setValue("Another Label");
    validationResult = await validator(formControl);
    expect(validationResult).toEqual({ uniqueProperty: expect.any(String) });
  });
});
