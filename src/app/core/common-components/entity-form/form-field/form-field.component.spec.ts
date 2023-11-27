import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormFieldComponent } from "./form-field.component";
import { EntityFormService } from "../entity-form.service";
import { Entity } from "../../../entity/model/entity";

describe("FormFieldComponent", () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;
  const mockField = { id: "testField" };

  beforeEach(() => {
    mockFormService = jasmine.createSpyObj(["extendFormFieldConfig"]);
    mockFormService.extendFormFieldConfig.and.returnValue(mockField);

    TestBed.configureTestingModule({
      imports: [FormFieldComponent],
      providers: [{ provide: EntityFormService, useValue: mockFormService }],
    });
    fixture = TestBed.createComponent(FormFieldComponent);
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
});
