import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionsEditorComponent } from "./conditions-editor.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { MatDialog } from "@angular/material/dialog";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { Entity } from "app/core/entity/model/entity";

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
    component.entityConstructor = Entity;
    component.conditions = { $or: [] };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with empty conditions", () => {
    expect(component.getConditionsArray()).toEqual([]);
  });

  it("should add a new condition", () => {
    component.addCondition();
    expect(component.getConditionsArray().length).toBe(1);
    expect(component.getConditionsArray()[0]).toEqual({});
  });

  it("should delete a condition", () => {
    component.conditions = { $or: [{ name: "Test" }] };
    component.ngOnInit();
    expect(component.getConditionsArray().length).toBe(1);

    component.deleteCondition(0);
    expect(component.getConditionsArray().length).toBe(0);
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
    const fieldConfig = {
      dataType: "string",
      label: "Name",
    };
    component.entityConstructor.schema.set("name", fieldConfig as any);
    mockEntitySchemaService.getComponent.and.returnValue("test-component");

    component.onConditionFieldChange(0, "name");

    expect(component.getConditionsArray()[0]).toEqual({ name: null });
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
    const fieldConfig = {
      dataType: "string",
      label: "Name",
    };
    component.entityConstructor.schema.set("name", fieldConfig as any);
    mockEntitySchemaService.getComponent.and.returnValue("test-component");
    mockEntitySchemaService.valueToEntityFormat.and.returnValue("Test Value");

    component.conditions = { $or: [{ name: "Test" }] };
    component.ngOnInit();

    expect(component.conditionFormFieldConfigs.size).toBe(1);
    expect(component.conditionFormControls.size).toBe(1);
  });
});
