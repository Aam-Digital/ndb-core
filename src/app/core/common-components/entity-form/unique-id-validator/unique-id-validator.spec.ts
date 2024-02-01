import { waitForAsync } from "@angular/core/testing";
import { uniqueIdValidator } from "./unique-id-validator";
import { FormControl, ValidatorFn } from "@angular/forms";

describe("UniqueIdValidator", () => {
  let validator: ValidatorFn;

  let demoIds;
  let formControl: FormControl;

  beforeEach(waitForAsync(() => {
    demoIds = ["id1", "id2", "id3"];
    formControl = new FormControl();
    validator = uniqueIdValidator(demoIds);
  }));

  it("should validate new id", async () => {
    formControl.setValue("new id");
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toBeNull();
  });

  it("should disallow already existing id", async () => {
    formControl.setValue(demoIds[1]);
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ uniqueId: jasmine.any(String) });
  });

  it("should allow to keep unchanged value (to not refuse saving an existing entity with unchanged id)", async () => {
    formControl = new FormControl(demoIds[1], { nonNullable: true });
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(formControl.pristine).toBeFalse();
    expect(validationResult).toBeNull();
  });
});
