import { ComponentFixture, TestBed } from "@angular/core/testing";
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
    component.section = mockSection;
    component.colorFieldOptions = mockColorFieldOptions;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
