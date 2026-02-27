import { waitForAsync } from "@angular/core/testing";
import { uniquePropertyValidator } from "./unique-property-validator";
import { AsyncValidatorFn, FormControl } from "@angular/forms";

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

    expect(validationResult).toEqual({ uniqueProperty: jasmine.any(String) });
  });

  it("should allow to keep unchanged value (to not refuse saving an existing entity with unchanged value)", async () => {
    formControl = new FormControl(demoValues[1], { nonNullable: true });
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(formControl.pristine).toBeFalse();
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

    expect(validationResult).toEqual({ uniqueProperty: jasmine.any(String) });
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
    expect(validationResult).toEqual({ uniqueProperty: jasmine.any(String) });
  });
});
