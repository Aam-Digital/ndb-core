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
  @DatabaseField() name: string;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: "genders",
    isArray: true,
  })
  gender: string[];
}

describe("ConditionsEditorComponent", () => {
  let component: ConditionsEditorComponent;
  let fixture: ComponentFixture<ConditionsEditorComponent>;
  let mockEntitySchemaService: jasmine.SpyObj<EntitySchemaService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockEntitySchemaService = jasmine.createSpyObj("EntitySchemaService", [
      "valueToEntityFormat",
      "valueToDatabaseFormat",
      "getComponent",
    ]);
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

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
    spyOn(component.conditionsChange, "emit");
    component.addCondition();
    expect(component.conditionsChange.emit).toHaveBeenCalledWith({
      $or: [{}],
    });
  });

  it("should handle condition field change", () => {
    component.addCondition();
    const fieldConfig = component.entityConstructor.schema.get("name");
    mockEntitySchemaService.getComponent.and.returnValue("test-component");

    component.onConditionFieldChange(0, "name");

    expect(component.conditionsArray()[0]).toEqual({ name: null });
    expect(mockEntitySchemaService.getComponent).toHaveBeenCalledWith(
      fieldConfig,
      "edit",
    );
  });

  it("should open JSON editor dialog", () => {
    const dialogRef = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
    dialogRef.afterClosed.and.returnValue({ subscribe: () => {} } as any);
    mockDialog.open.and.returnValue(dialogRef);

    component.openJsonEditor();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it("should rebuild form configs on init with existing conditions", () => {
    mockEntitySchemaService.getComponent.and.returnValue("test-component");
    mockEntitySchemaService.valueToEntityFormat.and.returnValue("Test Value");

    component.conditions = { $or: [{ name: "Test" }] };
    component.ngOnInit();

    expect(component.conditionFormFieldConfigs.size).toBe(1);
    expect(component.conditionFormControls.size).toBe(1);
  });

  it("should wrap array field values in $elemMatch", () => {
    component.addCondition();
    mockEntitySchemaService.getComponent.and.returnValue("test-component");
    mockEntitySchemaService.valueToEntityFormat.and.returnValue(null);
    mockEntitySchemaService.valueToDatabaseFormat.and.returnValue(["X"]);

    component.onConditionFieldChange(0, "gender");

    const formControl = component.conditionFormControls.get("0");
    formControl.setValue(["X"]);

    expect(component.conditionsArray()[0]).toEqual({
      gender: { $elemMatch: { $eq: "X" } },
    });
  });

  it("should extract value from $elemMatch when loading array field conditions", () => {
    mockEntitySchemaService.getComponent.and.returnValue("test-component");
    mockEntitySchemaService.valueToEntityFormat.and.callFake(
      (val) => val || [],
    );

    component.conditions = {
      $or: [{ gender: { $elemMatch: { $eq: "X" } } }],
    };
    component.ngOnInit();

    expect(mockEntitySchemaService.valueToEntityFormat).toHaveBeenCalledWith(
      ["X"],
      jasmine.objectContaining({ isArray: true }),
    );
  });

  it("should handle non-array fields normally", () => {
    component.addCondition();
    mockEntitySchemaService.getComponent.and.returnValue("test-component");
    mockEntitySchemaService.valueToEntityFormat.and.returnValue(null);
    mockEntitySchemaService.valueToDatabaseFormat.and.returnValue("John");

    component.onConditionFieldChange(0, "name");

    const formControl = component.conditionFormControls.get("0");
    formControl.setValue("John");

    expect(component.conditionsArray()[0]).toEqual({ name: "John" });
  });
});
