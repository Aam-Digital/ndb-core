import { ComponentFixture, TestBed } from "@angular/core/testing";

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
});
