import { ComponentFixture, TestBed } from "@angular/core/testing";
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
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Validators } from "@angular/forms";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { AttendanceDatatype } from "#src/app/features/attendance/model/attendance.datatype";

describe("AdminEntityFieldComponent", () => {
  let component: AdminEntityFieldComponent;
  let fixture: ComponentFixture<AdminEntityFieldComponent>;
  let loader: HarnessLoader;
  let dialogData: {
    entitySchemaField: EntitySchemaField;
    entityType: typeof Entity;
    overwriteLocally?: boolean;
  };

  let mockEnumService: any;
  let confirmationDialog: any;

  beforeEach(() => {
    mockEnumService = {
      getEnum: vi.fn(),
      listEnums: vi.fn(),
      preLoadEnums: vi.fn(),
    };
    confirmationDialog = {
      getConfirmation: vi.fn(),
    };
    confirmationDialog.getConfirmation.mockResolvedValue(true);
    mockEnumService.listEnums.mockReturnValue([]);
    dialogData = {
      entitySchemaField: { datatype: "" } as unknown as EntitySchemaField,
      entityType: Entity,
    };

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
          useValue: dialogData,
        },
        { provide: MatDialogRef, useValue: { close: () => null } },
        { provide: ConfigurableEnumService, useValue: mockEnumService },
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityFieldComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function recreateComponentWithData(
    entitySchemaField: EntitySchemaField,
    entityType: typeof Entity = TestEntity,
  ) {
    dialogData.entitySchemaField = entitySchemaField;
    dialogData.entityType = entityType;
    fixture.destroy();
    fixture = TestBed.createComponent(AdminEntityFieldComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should generate id (if new field) from label", async () => {
    component.schemaFieldsForm.get("label").setValue("New Label");
    await fixture.whenStable();
    expect(component.fieldIdForm.value).toBe(generateIdFromLabel("New Label"));

    component.fieldIdForm.setValue("new_id");
    component.schemaFieldsForm.get("label").setValue("Changed Label");
    await fixture.whenStable();
    expect(component.fieldIdForm.value).toBe("new_id");
  });

  it("should include 'additional' field only for relevant datatypes", async () => {
    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    async function findAdditionalInputComponent() {
      try {
        const field = await loader.getHarness(
          MatFormFieldHarness.with({
            floatingLabelText: /Type Details.*/,
          }),
        );
        return await field.getControl(MatInputHarness);
      } catch {
        return undefined;
      }
    }

    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    fixture.detectChanges();
    await fixture.whenStable();
    let additionalInput = await findAdditionalInputComponent();
    expect(additionalInput).toBeTruthy();
    expect(component.additionalForm.hasValidator(Validators.required)).toBe(
      true,
    );

    dataTypeForm.setValue(StringDatatype.dataType);
    fixture.detectChanges();
    await fixture.whenStable();
    additionalInput = await findAdditionalInputComponent();
    expect(additionalInput).toBeUndefined();
    expect(component.additionalForm.value).toBeNull();
    expect(component.additionalForm.hasValidator(Validators.required)).toBe(
      false,
    );

    dataTypeForm.setValue(EntityDatatype.dataType);
    fixture.detectChanges();
    await fixture.whenStable();
    additionalInput = await findAdditionalInputComponent();
    expect(additionalInput).toBeTruthy();
    expect(component.additionalForm.hasValidator(Validators.required)).toBe(
      true,
    );
  });

  it("should init 'additional' options for configurable-enum", async () => {
    const mockEnumList = ["A", "B"];
    mockEnumService.listEnums.mockReturnValue(mockEnumList);

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    await fixture.whenStable();

    expect(component.typeAdditionalOptions).toEqual(
      mockEnumList.map((x) => ({ value: x, label: x })),
    );
  });

  it("should init 'additional' value from schema field for configurable-enum", async () => {
    await recreateComponentWithData({
      label: "Category",
      dataType: ConfigurableEnumDatatype.dataType,
      additional: "genders",
    } as EntitySchemaField);

    expect(component.additionalForm.value).toBe("genders");
  });
  it("should generate 'additional' value from label for configurable-enum", async () => {
    component.schemaFieldsForm.get("label").setValue("test label");
    await fixture.whenStable();

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    await fixture.whenStable();
    expect(component.additionalForm.value).toBe(
      generateIdFromLabel("test label"),
    );
  });
  it("should generate manually created 'additional' value for configurable-enum", async () => {
    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    await fixture.whenStable();

    let newAdditional;
    component
      .createNewAdditionalOptionAsync("newEnumId")
      .then((result) => (newAdditional = result));
    await fixture.whenStable();

    expect(newAdditional).toEqual({
      label: "newEnumId",
      value: "newEnumId",
    });
  });

  it("should init 'additional' options for entity datatypes", async () => {
    const mockEntityTypes = [TestEntity, Note];
    const entityRegistry = TestBed.inject(EntityRegistry);
    vi.spyOn(entityRegistry, "getEntityTypes").mockReturnValue(
      mockEntityTypes.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );

    await recreateComponentWithData({
      label: "ref",
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    } as EntitySchemaField);

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(EntityDatatype.dataType);
    await fixture.whenStable();

    expect(component.additionalForm.value).toBe(TestEntity.ENTITY_TYPE);
  });

  it("should support array values for entity type additional", async () => {
    await recreateComponentWithData({
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, Note.ENTITY_TYPE],
    } as EntitySchemaField);
    await fixture.whenStable();

    expect(component.entityAdditionalMultiSelect()).toBe(true);
    expect(component.additionalForm.value).toEqual([
      TestEntity.ENTITY_TYPE,
      Note.ENTITY_TYPE,
    ]);
  });

  it("should convert entity additional from single to multi mode", async () => {
    await recreateComponentWithData({
      label: "ref",
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    } as EntitySchemaField);
    await fixture.whenStable();

    await component.onEntityAdditionalSelectionModeChange({
      checked: true,
      source: { checked: true } as any,
    } as any);
    await fixture.whenStable();

    expect(component.entityAdditionalMultiSelect()).toBe(true);
    expect(component.additionalForm.value).toEqual([TestEntity.ENTITY_TYPE]);
  });

  it("should ask confirmation and clear value when switching to single mode with multiple selections", async () => {
    await recreateComponentWithData({
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, Note.ENTITY_TYPE],
    } as EntitySchemaField);
    await fixture.whenStable();

    await component.onEntityAdditionalSelectionModeChange({
      checked: false,
      source: { checked: false } as any,
    } as any);
    await fixture.whenStable();

    expect(confirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.entityAdditionalMultiSelect()).toBe(false);
    expect(component.additionalForm.value).toBeNull();
  });

  it("should keep multi mode when switching to single mode is not confirmed", async () => {
    confirmationDialog.getConfirmation.mockResolvedValue(false);
    await recreateComponentWithData({
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, Note.ENTITY_TYPE],
    } as EntitySchemaField);
    await fixture.whenStable();

    const mockToggle = { checked: false };
    await component.onEntityAdditionalSelectionModeChange({
      checked: false,
      source: mockToggle as any,
    } as any);
    await fixture.whenStable();

    expect(component.entityAdditionalMultiSelect()).toBe(true);
    expect(mockToggle.checked).toBe(true);
    expect(component.additionalForm.value).toEqual([
      TestEntity.ENTITY_TYPE,
      Note.ENTITY_TYPE,
    ]);
  });

  it("should init 'additional' for attendance datatype from nested format", async () => {
    const mockEntityTypes = [TestEntity, Note];
    const entityRegistry = TestBed.inject(EntityRegistry);
    vi.spyOn(entityRegistry, "getEntityTypes").mockReturnValue(
      mockEntityTypes.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );

    await recreateComponentWithData({
      label: "Attendance",
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: "entity",
          additional: [TestEntity.ENTITY_TYPE, Note.ENTITY_TYPE],
        },
      },
    } as EntitySchemaField);
    await fixture.whenStable();

    expect(component.attendanceParticipantTypesForm.value).toEqual([
      TestEntity.ENTITY_TYPE,
      Note.ENTITY_TYPE,
    ]);
    expect(component.additionalForm.value).toEqual({
      participant: {
        dataType: "entity",
        additional: [TestEntity.ENTITY_TYPE, Note.ENTITY_TYPE],
      },
    });
  });

  it("should sync attendance participant type selection to nested additional format", async () => {
    const mockEntityTypes = [TestEntity, Note];
    const entityRegistry = TestBed.inject(EntityRegistry);
    vi.spyOn(entityRegistry, "getEntityTypes").mockReturnValue(
      mockEntityTypes.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );

    await recreateComponentWithData({
      label: "Attendance",
      dataType: "attendance",
      isArray: true,
    } as EntitySchemaField);
    await fixture.whenStable();

    component.attendanceParticipantTypesForm.setValue([TestEntity.ENTITY_TYPE]);
    await fixture.whenStable();

    expect(component.additionalForm.value).toEqual({
      participant: {
        dataType: "entity",
        additional: [TestEntity.ENTITY_TYPE],
      },
    });

    component.attendanceParticipantTypesForm.setValue([]);
    await fixture.whenStable();
    expect(component.additionalForm.value).toBeNull();
  });

  it("should validate that label is unique", async () => {
    class TestEntityWithFields extends Entity {
      static override readonly ENTITY_TYPE = "TestEntityWithFields";
      static override readonly label = "Test Entity";
      static override readonly schema = new Map<string, EntitySchemaField>([
        ["field1", { id: "field1", label: "Existing Label 1" }],
        ["field2", { id: "field2", label: "Existing Label 2" }],
        ["field3", { id: "field3", label: "Another Field" }],
      ]);
    }

    await recreateComponentWithData(
      { label: "New Label", id: undefined } as EntitySchemaField,
      TestEntityWithFields,
    );
    await fixture.whenStable();

    const labelControl = component.schemaFieldsForm.get("label");

    labelControl.setValue("Unique New Label");
    await fixture.whenStable();
    expect(labelControl.errors).toBeNull();

    labelControl.setValue("Existing Label 1");
    await fixture.whenStable();
    expect(labelControl.errors).toEqual({
      uniqueProperty: expect.any(String),
    });

    labelControl.setValue("existing label 2");
    await fixture.whenStable();
    expect(labelControl.errors).toEqual({
      uniqueProperty: expect.any(String),
    });
  });

  it("should allow keeping the same label when editing existing field", async () => {
    class TestEntityWithFields extends Entity {
      static override readonly ENTITY_TYPE = "TestEntityWithFields";
      static override readonly label = "Test Entity";
      static override readonly schema = new Map<string, EntitySchemaField>([
        ["field1", { id: "field1", label: "Existing Label" }],
        ["field2", { id: "field2", label: "Another Label" }],
      ]);
    }

    await recreateComponentWithData(
      {
        id: "field1",
        label: "Existing Label",
      } as EntitySchemaField,
      TestEntityWithFields,
    );
    await fixture.whenStable();

    const labelControl = component.schemaFieldsForm.get("label");

    expect(labelControl.value).toBe("Existing Label");
    await fixture.whenStable();
    expect(labelControl.errors).toBeNull();

    labelControl.setValue("Another Label");
    await fixture.whenStable();
    expect(labelControl.errors).toEqual({
      uniqueProperty: expect.any(String),
    });
  });

  it("should reject a field ID that differs only in capitalization from an existing field ID", async () => {
    class TestEntityWithFields extends Entity {
      static override readonly ENTITY_TYPE = "TestEntityWithFields";
      static override readonly label = "Test Entity";
      static override readonly schema = new Map<string, EntitySchemaField>([
        ["testField", { id: "testField", label: "Test Field" }],
        ["otherField", { id: "otherField", label: "Other Field" }],
      ]);
    }

    await recreateComponentWithData(
      { label: "New Field", id: undefined } as EntitySchemaField,
      TestEntityWithFields,
    );
    await fixture.whenStable();

    component.fieldIdForm.setValue("brandNewField");
    await fixture.whenStable();
    expect(component.fieldIdForm.errors).toBeNull();

    component.fieldIdForm.setValue("testField");
    await fixture.whenStable();
    expect(component.fieldIdForm.errors).toEqual({
      uniqueProperty: expect.any(String),
    });

    component.fieldIdForm.setValue("TestField");
    await fixture.whenStable();
    expect(component.fieldIdForm.errors).toEqual({
      uniqueProperty: expect.any(String),
    });

    component.fieldIdForm.setValue("TESTFIELD");
    await fixture.whenStable();
    expect(component.fieldIdForm.errors).toEqual({
      uniqueProperty: expect.any(String),
    });
  });
});
