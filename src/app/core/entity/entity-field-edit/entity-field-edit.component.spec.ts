import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";

import { ComponentRegistry } from "../../../dynamic-components";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { Entity } from "../model/entity";
import { EntityFieldEditComponent } from "./entity-field-edit.component";

describe("EntityFieldEditComponent", () => {
  let component: EntityFieldEditComponent;
  let fixture: ComponentFixture<EntityFieldEditComponent>;

  let mockFormService: any;
  let mockSchemaService: any;
  const mockField = { id: "testField" };

  beforeEach(() => {
    mockFormService = {
      extendFormFieldConfig: vi.fn(),
    };
    mockFormService.extendFormFieldConfig.mockReturnValue(mockField);

    mockSchemaService = {
      getComponent: vi.fn().mockReturnValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [EntityFieldEditComponent],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        { provide: EntitySchemaService, useValue: mockSchemaService },
        ComponentRegistry,
      ],
    });
    fixture = TestBed.createComponent(EntityFieldEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should use EntityFormService to extend field config", () => {
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());

    // Read the signal to trigger the lazy computation
    expect(component._field()).toEqual(mockField);
    expect(mockFormService.extendFormFieldConfig).toHaveBeenCalledWith(
      "testField",
      Entity,
    );
  });

  it("should silently hide if no entity with constructor is given", () => {
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", undefined);

    const result = component._field();
    expect(result).toBeDefined();
    expect(mockFormService.extendFormFieldConfig).not.toHaveBeenCalled();
  });

  it("should fall back to the read-only view if the form has no control for the field", () => {
    // e.g. after the entity schema was edited in the admin UI, a configured field
    // can be missing from the already-built formGroup
    mockFormService.extendFormFieldConfig.mockReturnValue({
      id: "testField",
      editComponent: "EditText",
    });
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("form", { formGroup: new FormGroup({}) });

    expect(component.formControl()).toBeNull();
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(
      fixture.nativeElement.querySelector("app-entity-field-view"),
    ).toBeTruthy();
  });

  it("should not fall back to the read-only view if the form has a control for the field", () => {
    mockFormService.extendFormFieldConfig.mockReturnValue({
      id: "testField",
      editComponent: "EditText",
    });
    fixture.componentRef.setInput("field", "testField");
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("form", {
      formGroup: new FormGroup({ testField: new FormControl("") }),
    });

    expect(component.formControl()).toBeTruthy();
    // the edit branch is entered, so the read-only fallback is not rendered
    // (rendering the dynamic edit component itself is out of scope here)
    try {
      fixture.detectChanges();
    } catch {
      // dynamic edit component has its own dependencies, not provided in this test
    }
    expect(
      fixture.nativeElement.querySelector("app-entity-field-view"),
    ).toBeFalsy();
  });
});
