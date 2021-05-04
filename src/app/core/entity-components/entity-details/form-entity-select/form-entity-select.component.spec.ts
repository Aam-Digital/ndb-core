import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormEntitySelectComponent } from "./form-entity-select.component";
import { AbstractControl } from "@angular/forms";
import { School } from "../../../../child-dev-project/schools/model/school";

function mockAbstractControl(initial: any = null): AbstractControl {
  return {
    value: initial,
    setValue(value: any) {
      this.value = value;
    },
  } as AbstractControl;
}

describe("ConfigurableEntitySelectComponent", () => {
  let component: FormEntitySelectComponent<any>;
  let fixture: ComponentFixture<FormEntitySelectComponent<any>>;
  const configId = "id";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormEntitySelectComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormEntitySelectComponent);
    component = fixture.componentInstance;
    component.source = {
      id: mockAbstractControl(),
    };
    component.configId = configId;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("selects the correct entity type from a standard type when it's present", () => {
    ["Child", "School"].forEach((standardType) => {
      component.standardType = standardType;
      expect(component.entityType).toBeDefined();
      expect(component.entityBlockComponent).toBeDefined();
    });
  });

  it("throws when a non-existing entity-type is selected", () => {
    expect(() => {
      component.standardType = "EvilType";
    }).toThrow();
  });

  it("selects a standard component when an entity exists but no block component for it", () => {
    component.standardType = "User";
    expect(component.entityType).toBeDefined();
    expect(component.entityBlockComponent).not.toBeDefined();
  });

  it("creates a config when correctly configured", () => {
    component.standardType = "School";
    const mockEntity = new School();
    const config = component.createConfigFor(mockEntity);
    expect(config.component).toEqual("SchoolBlock");
    expect(config.config).toEqual({
      entity: mockEntity,
      linkDisabled: true,
      tooltipDisabled: true,
    });
  });
});
