import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConditionalColorSectionComponent } from "./conditional-color-section.component";
import { ColorMapping } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

describe("ConditionalColorSectionComponent", () => {
  let component: ConditionalColorSectionComponent;
  let fixture: ComponentFixture<ConditionalColorSectionComponent>;

  const mockColorFieldOptions: SimpleDropdownValue[] = [
    { value: "status", label: "Status" },
    { value: "name", label: "Name" },
  ];

  const mockSection: ColorMapping = {
    condition: { $or: [{ status: "active" }] },
    color: "#FF0000",
  };

  const mockFormFieldConfig: FormFieldConfig = {
    id: "status",
    editComponent: null,
    dataType: null,
    label: "Status",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConditionalColorSectionComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalColorSectionComponent);
    component = fixture.componentInstance;
    component.sectionIndex = 0;
    component.section = mockSection;
    component.colorFieldOptions = mockColorFieldOptions;

    // Set up form controls map
    component.conditionFormFieldConfigs = new Map();
    component.conditionFormControls = new Map();
    component.conditionFormFieldConfigs.set("0-0", mockFormFieldConfig);
    component.conditionFormControls.set("0-0", new FormControl("active"));

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should get conditions from section", () => {
    expect(component.conditions).toEqual([{ status: "active" }]);
  });

  it("should get empty array when section has no $or condition", () => {
    component.section = { condition: {}, color: "#FF0000" };
    expect(component.conditions).toEqual([]);
  });

  it("should emit colorChange when color changes", () => {
    spyOn(component.colorChange, "emit");

    component.onColorChange("#00FF00");

    expect(component.colorChange.emit).toHaveBeenCalledWith("#00FF00");
  });

  it("should emit deleteSection when delete button is clicked", () => {
    spyOn(component.deleteSection, "emit");

    component.onDeleteSection();

    expect(component.deleteSection.emit).toHaveBeenCalled();
  });

  it("should emit addCondition when add condition button is clicked", () => {
    spyOn(component.addCondition, "emit");

    component.onAddCondition();

    expect(component.addCondition.emit).toHaveBeenCalled();
  });

  it("should emit deleteCondition when condition is deleted", () => {
    spyOn(component.deleteCondition, "emit");

    component.onDeleteCondition(0);

    expect(component.deleteCondition.emit).toHaveBeenCalledWith(0);
  });

  it("should emit conditionFieldChange when condition field changes", () => {
    spyOn(component.conditionFieldChange, "emit");

    component.onConditionFieldChange(0, "name");

    expect(component.conditionFieldChange.emit).toHaveBeenCalledWith({
      conditionIndex: 0,
      fieldKey: "name",
    });
  });

  it("should get condition field from condition object", () => {
    expect(component.getConditionField({ status: "active" })).toBe("status");
  });

  it("should get empty string for condition field when condition is empty", () => {
    expect(component.getConditionField({})).toBe("");
  });
});