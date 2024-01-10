import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldEditComponent } from "./entity-field-edit.component";
import { EntityFormService } from "../entity-form/entity-form.service";
import { Entity } from "../../entity/model/entity";
import { ComponentRegistry } from "../../../dynamic-components";

describe("EntityFieldEditComponent", () => {
  let component: EntityFieldEditComponent;
  let fixture: ComponentFixture<EntityFieldEditComponent>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;
  const mockField = { id: "testField" };

  beforeEach(() => {
    mockFormService = jasmine.createSpyObj(["extendFormFieldConfig"]);
    mockFormService.extendFormFieldConfig.and.returnValue(mockField);

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
    component.field = "testField";
    component.entity = new Entity();

    component.ngOnChanges({ field: true as any });

    expect(mockFormService.extendFormFieldConfig).toHaveBeenCalledWith(
      "testField",
      Entity,
    );
    expect(component._field).toEqual(mockField);
  });

  it("should silently hide if no entity with constructor is given", () => {
    component.field = "testField";
    component.entity = undefined;

    component.ngOnChanges({ field: true as any });

    expect(component).toBeTruthy();
  });
});
