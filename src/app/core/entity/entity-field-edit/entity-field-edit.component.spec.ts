import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ComponentRegistry } from "../../../dynamic-components";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { Entity } from "../model/entity";
import { EntityFieldEditComponent } from "./entity-field-edit.component";

describe("EntityFieldEditComponent", () => {
  let component: EntityFieldEditComponent;
  let fixture: ComponentFixture<EntityFieldEditComponent>;

  let mockFormService: any;
  const mockField = { id: "testField" };

  beforeEach(() => {
    mockFormService = {
      extendFormFieldConfig: vi.fn(),
    };
    mockFormService.extendFormFieldConfig.mockReturnValue(mockField);

    TestBed.configureTestingModule({
      imports: [EntityFieldEditComponent],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
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

    expect(component).toBeTruthy();
  });
});
