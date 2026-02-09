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
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Validators } from "@angular/forms";
import { RecurringActivity } from "../../../../child-dev-project/attendance/model/recurring-activity";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";

describe("AdminEntityFieldComponent", () => {
  let component: AdminEntityFieldComponent;
  let fixture: ComponentFixture<AdminEntityFieldComponent>;
  let loader: HarnessLoader;

  let mockEnumService: jasmine.SpyObj<ConfigurableEnumService>;
  let confirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(() => {
    mockEnumService = jasmine.createSpyObj([
      "getEnum",
      "listEnums",
      "preLoadEnums",
    ]);
    confirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    confirmationDialog.getConfirmation.and.resolveTo(true);
    mockEnumService.listEnums.and.returnValue([]);

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
            entitySchemaField: { datatype: "" },
            entityType: Entity,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => null } },
        { provide: ConfigurableEnumService, useValue: mockEnumService },
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
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

  it("should generate id (if new field) from label", fakeAsync(() => {
    // Initially ID is automatically generated from label
    component.schemaFieldsForm.get("label").setValue("New Label");
    tick();
    expect(component.fieldIdForm.value).toBe(generateIdFromLabel("New Label"));

    // manual edit of ID field stops auto generation of ID
    component.fieldIdForm.setValue("new_id");
    component.schemaFieldsForm.get("label").setValue("Changed Label");
    expect(component.fieldIdForm.value).toBe("new_id");
  }));

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
        .catch((err) => {
          console.error(err);
          additionalInput = undefined;
        });
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
    mockEnumService.listEnums.and.returnValue(mockEnumList);

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(ConfigurableEnumDatatype.dataType);
    tick();

    expect(component.typeAdditionalOptions).toEqual(
      mockEnumList.map((x) => ({ value: x, label: x })),
    );
  }));

  it("should init 'additional' value from schema field for configurable-enum", fakeAsync(() => {
    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "Category",
      dataType: ConfigurableEnumDatatype.dataType,
      additional: "genders",
    };
    component.ngOnInit();

    expect(component.additionalForm.value).toBe("genders");
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
    const mockEntityTypes = [TestEntity, RecurringActivity];
    const entityRegistry = TestBed.inject(EntityRegistry);
    spyOn(entityRegistry, "getEntityTypes").and.returnValue(
      mockEntityTypes.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );

    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "ref",
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    };
    component.ngOnInit();

    const dataTypeForm = component.schemaFieldsForm.get("dataType");
    dataTypeForm.setValue(EntityDatatype.dataType);
    tick();

    expect(component.typeAdditionalOptions).toEqual([
      { value: TestEntity.ENTITY_TYPE, label: TestEntity.label },
      { value: RecurringActivity.ENTITY_TYPE, label: RecurringActivity.label },
    ]);
    expect(component.additionalForm.value).toBe(TestEntity.ENTITY_TYPE);
  }));

  it("should support array values for entity type additional", fakeAsync(() => {
    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, RecurringActivity.ENTITY_TYPE],
    };
    component.ngOnInit();
    tick();

    expect(component.entityAdditionalMultiSelect()).toBeTrue();
    expect(component.additionalForm.value).toEqual([
      TestEntity.ENTITY_TYPE,
      RecurringActivity.ENTITY_TYPE,
    ]);
  }));

  it("should convert entity additional from single to multi mode", fakeAsync(() => {
    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "ref",
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    };
    component.ngOnInit();
    tick();

    void component.onEntityAdditionalSelectionModeChange(true);
    tick();

    expect(component.entityAdditionalMultiSelect()).toBeTrue();
    expect(component.additionalForm.value).toEqual([TestEntity.ENTITY_TYPE]);
  }));

  it("should ask confirmation and clear value when switching to single mode with multiple selections", fakeAsync(() => {
    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, RecurringActivity.ENTITY_TYPE],
    };
    component.ngOnInit();
    tick();

    void component.onEntityAdditionalSelectionModeChange(false);
    tick();

    expect(confirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.entityAdditionalMultiSelect()).toBeFalse();
    expect(component.additionalForm.value).toBeNull();
  }));

  it("should keep multi mode when switching to single mode is not confirmed", fakeAsync(() => {
    confirmationDialog.getConfirmation.and.resolveTo(false);
    component.data.entityType = TestEntity;
    component.data.entitySchemaField = {
      label: "related records",
      dataType: EntityDatatype.dataType,
      additional: [TestEntity.ENTITY_TYPE, RecurringActivity.ENTITY_TYPE],
    };
    component.ngOnInit();
    tick();

    void component.onEntityAdditionalSelectionModeChange(false);
    tick();

    expect(component.entityAdditionalMultiSelect()).toBeTrue();
    expect(component.additionalForm.value).toEqual([
      TestEntity.ENTITY_TYPE,
      RecurringActivity.ENTITY_TYPE,
    ]);
  }));
});
