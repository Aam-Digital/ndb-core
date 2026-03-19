import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionsEditorComponent } from "./conditions-editor.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { MatDialog } from "@angular/material/dialog";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { Entity } from "app/core/entity/model/entity";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";

@DatabaseEntity("ConditionsEditorTestEntity")
class ConditionsEditorTestEntity extends Entity {
  @DatabaseField()
  name: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "genders",
    isArray: true,
  })
  gender: string[];
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "genders",
  })
  genderSingle: string;
}

describe("ConditionsEditorComponent", () => {
  let component: ConditionsEditorComponent;
  let fixture: ComponentFixture<ConditionsEditorComponent>;
  let mockEntitySchemaService: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockEntitySchemaService = {
      valueToEntityFormat: vi
        .fn()
        .mockName("EntitySchemaService.valueToEntityFormat"),
      valueToDatabaseFormat: vi
        .fn()
        .mockName("EntitySchemaService.valueToDatabaseFormat"),
      getComponent: vi.fn().mockName("EntitySchemaService.getComponent"),
      getDatatypeOrDefault: vi
        .fn()
        .mockName("EntitySchemaService.getDatatypeOrDefault"),
    };
    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };

    await TestBed.configureTestingModule({
      imports: [ConditionsEditorComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntitySchemaService, useValue: mockEntitySchemaService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionsEditorComponent);
    component = fixture.componentInstance;
    component.entityConstructor = ConditionsEditorTestEntity;
    component.conditions = { $or: [] };
    mockEntitySchemaService.getComponent.mockImplementation(
      (fieldConfig: { dataType?: string }) =>
        fieldConfig?.dataType === "configurable-enum"
          ? "EditConfigurableEnum"
          : "test-component",
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with empty conditions", () => {
    expect(component.conditionsArray()).toEqual([]);
  });

  it("should add a new condition", () => {
    component.addCondition();
    expect(component.conditionsArray().length).toBe(1);
    expect(component.conditionsArray()[0]).toEqual({});
  });

  it("should delete a condition", () => {
    component.conditions = { $or: [{ name: "Test" }] };
    component.ngOnInit();
    expect(component.conditionsArray().length).toBe(1);

    component.deleteCondition(0);
    expect(component.conditionsArray().length).toBe(0);
  });

  it("should emit conditionsChange when conditions are modified", () => {
    vi.spyOn(component.conditionsChange, "emit");
    component.addCondition();
    expect(component.conditionsChange.emit).toHaveBeenCalledWith({
      $or: [{}],
    });
  });

  it("should handle condition field change", () => {
    component.addCondition();
    const fieldConfig = component.entityConstructor.schema.get("name");

    component.onConditionFieldChange(0, "name");

    expect(component.conditionsArray()[0]).toEqual({ name: null });
    expect(mockEntitySchemaService.getComponent).toHaveBeenCalledWith(
      fieldConfig,
      "edit",
    );
  });

  it("should open JSON editor dialog", () => {
    const dialogRef = {
      afterClosed: vi.fn().mockName("MatDialogRef.afterClosed"),
    };
    dialogRef.afterClosed.mockReturnValue({ subscribe: () => {} } as any);
    mockDialog.open.mockReturnValue(dialogRef);

    component.openJsonEditor();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it("should rebuild form configs on init with existing conditions", () => {
    mockEntitySchemaService.valueToEntityFormat.mockReturnValue("Test Value");

    component.conditions = { $or: [{ name: "Test" }] };
    component.ngOnInit();

    expect(component.conditionFormFieldConfigs.size).toBe(1);
    expect(component.conditionFormControls.size).toBe(1);
  });

  it("should wrap array field values in $elemMatch", () => {
    component.addCondition();
    mockEntitySchemaService.valueToEntityFormat.mockReturnValue(null);
    mockEntitySchemaService.valueToDatabaseFormat.mockReturnValue(["X"]);

    component.onConditionFieldChange(0, "gender");

    const formControl = component.conditionFormControls.get("0");
    formControl.setValue(["X"]);

    expect(component.conditionsArray()[0]).toEqual({
      gender: { $elemMatch: { $in: ["X"] } },
    });
  });

  it("should extract value from $elemMatch when loading array field conditions", () => {
    mockEntitySchemaService.valueToEntityFormat.mockImplementation(
      (val) => val || [],
    );

    component.conditions = {
      $or: [{ gender: { $elemMatch: { $in: ["X"] } } }],
    };
    component.ngOnInit();

    expect(mockEntitySchemaService.valueToEntityFormat).toHaveBeenCalledWith(
      ["X"],
      expect.objectContaining({ isArray: true }),
    );
  });

  it("should handle non-array fields normally", () => {
    component.addCondition();
    mockEntitySchemaService.valueToEntityFormat.mockReturnValue(null);
    mockEntitySchemaService.valueToDatabaseFormat.mockReturnValue("John");

    component.onConditionFieldChange(0, "name");

    const formControl = component.conditionFormControls.get("0");
    formControl.setValue("John");

    expect(component.conditionsArray()[0]).toEqual({ name: "John" });
  });

  it("should wrap non-array enum field multi-selection in $in", () => {
    component.addCondition();
    mockEntitySchemaService.valueToEntityFormat.mockReturnValue(null);
    mockEntitySchemaService.valueToDatabaseFormat.mockReturnValue(["X", "Y"]);

    component.onConditionFieldChange(0, "genderSingle");

    const formControl = component.conditionFormControls.get("0");
    formControl.setValue(["X", "Y"]);

    expect(component.conditionsArray()[0]).toEqual({
      genderSingle: { $in: ["X", "Y"] },
    });
  });

  it("should extract value from $in when loading non-array enum field conditions", () => {
    mockEntitySchemaService.valueToEntityFormat.mockImplementation(
      (val) => val || [],
    );

    component.conditions = {
      $or: [{ genderSingle: { $in: ["X"] } }],
    };
    component.ngOnInit();

    expect(mockEntitySchemaService.valueToEntityFormat).toHaveBeenCalledWith(
      ["X"],
      expect.objectContaining({
        isArray: true,
        dataType: "configurable-enum",
      }),
    );
  });
});
