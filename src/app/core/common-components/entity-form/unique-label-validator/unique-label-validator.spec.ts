import { waitForAsync } from "@angular/core/testing";
import { uniqueLabelValidator } from "./unique-label-validator";
import { FormControl, ValidatorFn } from "@angular/forms";
import { Entity } from "../../../entity/model/entity";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

describe("UniqueLabelValidator", () => {
  let validator: ValidatorFn;
  let formControl: FormControl;
  let testEntityType: typeof Entity;

  beforeEach(waitForAsync(() => {
    // Create a test entity type with some fields
    class TestEntity extends Entity {
      static override readonly ENTITY_TYPE = "TestEntity";
      static override label = "Test Entity";
      static override schema = new Map<string, EntitySchemaField>([
        ["field1", { id: "field1", label: "Name" }],
        ["field2", { id: "field2", label: "Age" }],
        ["field3", { id: "field3", label: "Email" }],
      ]);
    }
    testEntityType = TestEntity;
    formControl = new FormControl();
    validator = uniqueLabelValidator(testEntityType);
  }));

  it("should validate new label", async () => {
    formControl.setValue("New Field");
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toBeNull();
  });

  it("should disallow already existing label", async () => {
    formControl.setValue("Age");
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ duplicateLabel: jasmine.any(String) });
  });

  it("should disallow already existing label (case-insensitive)", async () => {
    formControl.setValue("name"); // lowercase version of "Name"
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ duplicateLabel: jasmine.any(String) });
  });

  it("should disallow already existing label (mixed case)", async () => {
    formControl.setValue("EMAIL"); // uppercase version of "Email"
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ duplicateLabel: jasmine.any(String) });
  });

  it("should trim whitespace when comparing labels", async () => {
    formControl.setValue("  Name  "); // "Name" with extra whitespace
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(validationResult).toEqual({ duplicateLabel: jasmine.any(String) });
  });

  it("should allow the same label when editing existing field", async () => {
    validator = uniqueLabelValidator(testEntityType, "field2");
    formControl = new FormControl("Age", { nonNullable: true });
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(formControl.pristine).toBeFalse();
    expect(validationResult).toBeNull();
  });

  it("should allow to keep unchanged value (default value)", async () => {
    formControl = new FormControl("Age", { nonNullable: true });
    formControl.markAsDirty();
    const validationResult = await validator(formControl);

    expect(formControl.pristine).toBeFalse();
    expect(validationResult).toBeNull();
  });
});
