import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConditionItemComponent } from "./condition-item.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

describe("ConditionItemComponent", () => {
  let component: ConditionItemComponent;
  let fixture: ComponentFixture<ConditionItemComponent>;

  const mockColorFieldOptions: SimpleDropdownValue[] = [
    { value: "status", label: "Status" },
    { value: "name", label: "Name" },
  ];

  const mockFormFieldConfig: FormFieldConfig = {
    id: "status",
    editComponent: null,
    dataType: null,
    label: "Status",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConditionItemComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionItemComponent);
    component = fixture.componentInstance;
    component.sectionIndex = 0;
    component.conditionIndex = 0;
    component.condition = { status: "active" };
    component.colorFieldOptions = mockColorFieldOptions;
    component.formFieldConfig = mockFormFieldConfig;
    component.formControl = new FormControl("active");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should get condition field from condition object", () => {
    expect(component.conditionField).toBe("status");
  });

  it("should get empty string for condition field when condition is empty", () => {
    component.condition = {};
    expect(component.conditionField).toBe("");
  });

  it("should emit conditionFieldChange when field changes", () => {
    spyOn(component.conditionFieldChange, "emit");

    component.onFieldChange("name");

    expect(component.conditionFieldChange.emit).toHaveBeenCalledWith("name");
  });

  it("should emit deleteCondition when delete button is clicked", () => {
    spyOn(component.deleteCondition, "emit");

    component.onDeleteCondition();

    expect(component.deleteCondition.emit).toHaveBeenCalled();
  });
});