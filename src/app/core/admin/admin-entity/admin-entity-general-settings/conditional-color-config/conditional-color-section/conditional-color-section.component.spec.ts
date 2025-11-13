import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConditionalColorSectionComponent } from "./conditional-color-section.component";
import { ColorMapping } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { ComponentRegistry } from "#src/app/dynamic-components";

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
    editComponent: "EditComponent",
    label: "Status",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionalColorSectionComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: ComponentRegistry,
          useValue: {},
        },
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

  it("should get condition field from condition object", () => {
    expect(component.getConditionField({ status: "active" })).toBe("status");
  });

  it("should get empty string for condition field when condition is empty", () => {
    expect(component.getConditionField({})).toBe("");
  });
});
