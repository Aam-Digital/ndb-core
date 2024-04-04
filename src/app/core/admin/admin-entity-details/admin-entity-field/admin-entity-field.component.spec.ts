import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { AdminEntityFieldComponent } from "./admin-entity-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatFormFieldHarness } from "@angular/material/form-field/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { Entity } from "../../../entity/model/entity";
import { ConfigurableEnumDatatype } from "../../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { StringDatatype } from "../../../basic-datatypes/string/string.datatype";
import { ConfigurableEnumService } from "../../../basic-datatypes/configurable-enum/configurable-enum.service";
import { generateIdFromLabel } from "../../../../utils/generate-id-from-label/generate-id-from-label";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { Validators } from "@angular/forms";
import { RecurringActivity } from "../../../../child-dev-project/attendance/model/recurring-activity";
import { AdminEntityService } from "../../admin-entity.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

describe("AdminEntityFieldComponent", () => {
  let component: AdminEntityFieldComponent;
  let fixture: ComponentFixture<AdminEntityFieldComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AdminEntityFieldComponent,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitySchemaField: {},
            entityType: Entity,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => null } },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityFieldComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should generate id (if new field) from label", async () => {
    const labelInput = await loader
      .getHarness(MatFormFieldHarness.with({ floatingLabelText: "Label" }))
      .then((field) => field.getControl(MatInputHarness));
    const idInput = await loader
      .getHarness(
        MatFormFieldHarness.with({ floatingLabelText: "Field ID (readonly)" }),
      )
      .then((field) => field.getControl(MatInputHarness));

    // Initially ID is automatically generated from label
    await labelInput.setValue("new label");
    await expectAsync(idInput.getValue()).toBeResolvedTo("newLabel");

    // manual edit of ID field stops auto generation of ID
    await idInput.setValue("my_id");
    await labelInput.setValue("other label");
    await expectAsync(idInput.getValue()).toBeResolvedTo("my_id");
  });

  it("should include 'additional' field only for relevant datatypes", fakeAsync(() => {
    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    let additionalInput: MatInputHarness;
    function findAdditionalInputComponent() {
      loader
        .getHarness(
          MatFormFieldHarness.with({
            floatingLabelText: /Type Details.*/,
          }),
        )
        .then((field) => field.getControl(MatInputHarness))
        .then((input) => (additionalInput = input))
        .catch(() => (additionalInput = undefined));
      tick();
    }

    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();
    findAdditionalInputComponent();
    expect(additionalInput).toBeTruthy();
    expect(
      component.additionalForm.hasValidator(Validators.required),
    ).toBeTrue();

    dataTypeForm.setValue(StringDatatype.dataType);
    tick();
    findAdditionalInputComponent();
    expect(additionalInput).toBeUndefined();
    expect(component.additionalForm.value).toBeNull();
    expect(
      component.additionalForm.hasValidator(Validators.required),
    ).toBeFalse();

    dataTypeForm.setValue(EntityDatatype.dataType);
    tick();
    findAdditionalInputComponent();
    expect(additionalInput).toBeTruthy();
    expect(
      component.additionalForm.hasValidator(Validators.required),
    ).toBeTrue();
  }));

  it("should init 'additional' options for configurable-enum", fakeAsync(() => {
    const mockEnumList = ["A", "B"];
    const enumService = TestBed.inject(ConfigurableEnumService);
    spyOn(enumService, "listEnums").and.returnValue(mockEnumList);

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();

    expect(component.typeAdditionalOptions).toEqual(
      mockEnumList.map((x) => ({ value: x, label: x })),
    );
  }));

  it("should init 'additional' value from schema field for configurable-enum", fakeAsync(() => {
    component.entitySchemaField.additional = "test-enum";
    component.schemaFieldsForm
      .get("label")
      .setValue("label ignored for enum id");
    expect(component.additionalForm.value).toBeNull();

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();
    expect(component.additionalForm.value).toBe("test-enum");
  }));
  it("should generate 'additional' value from label for configurable-enum", fakeAsync(() => {
    component.schemaFieldsForm.get("label").setValue("test label");
    tick();

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();
    expect(component.additionalForm.value).toBe(
      generateIdFromLabel("test label"),
    );
  }));
  it("should generate manually created 'additional' value for configurable-enum", fakeAsync(() => {
    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();

    let newAdditional;
    component
      .createNewAdditionalOptionAsync("newEnumId")
      .then((result) => (newAdditional = result));
    tick();

    expect(newAdditional).toEqual({
      label: "newEnumId",
      value: "newEnumId",
    });
  }));

  it("should init 'additional' options for entity datatypes", fakeAsync(() => {
    const mockEntityTypes = [Entity, RecurringActivity];
    const entityRegistry = TestBed.inject(EntityRegistry);
    spyOn(entityRegistry, "getEntityTypes").and.returnValue(
      mockEntityTypes.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );

    component.entitySchemaField.additional = RecurringActivity.ENTITY_TYPE;

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(EntityDatatype.dataType);
    tick();

    expect(component.typeAdditionalOptions).toEqual([
      { value: "Entity", label: "Entity" },
      { value: RecurringActivity.ENTITY_TYPE, label: RecurringActivity.label },
    ]);
    expect(component.additionalForm.value).toBe(RecurringActivity.ENTITY_TYPE);
  }));

  it("should update entityConstructor schema upon save", fakeAsync(() => {
    const testFieldData: EntitySchemaField = {
      label: "test field",
      dataType: "string",
      _isCustomizedField: true,
    };

    @DatabaseEntity("EntityUpdatedInAdminUI")
    class EntityUpdatedInAdminUI extends Entity {}

    component.entityType = EntityUpdatedInAdminUI;
    component.fieldId = "testField";
    component.schemaFieldsForm.get("label").setValue(testFieldData.label);
    component.schemaFieldsForm.get("dataType").setValue(testFieldData.dataType);

    const adminService = TestBed.inject(AdminEntityService);
    spyOn(adminService.entitySchemaUpdated, "next");

    component.save();
    tick();

    expect(EntityUpdatedInAdminUI.schema.get("testField")).toEqual(
      testFieldData,
    );
    expect(adminService.entitySchemaUpdated.next).toHaveBeenCalled();
  }));
});
