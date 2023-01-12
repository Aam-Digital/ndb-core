import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../config/config.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../configurable-enum.interface";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  const testEnum: ConfigurableEnumValue[] = [
    { id: "1", label: "option-1" },
    { id: "2", label: "option-2" },
  ];

  @DatabaseEntity("EditEnumTest")
  class EditEnumTest extends Entity {
    @DatabaseField({ dataType: "configurable-enum", additional: "test-enum" })
    enum: ConfigurableEnumValue;

    @DatabaseField({
      dataType: "array",
      innerDataType: "configurable-enum",
      additional: "test-enum",
    })
    enumMulti: ConfigurableEnumValue[];
  }

  let testFormGroup;

  beforeEach(async () => {
    testFormGroup = new FormBuilder().group({
      enum: new FormControl(),
      enumMulti: new FormControl(),
    });

    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue(testEnum);
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        EditConfigurableEnumComponent,
      ],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    initForEntity(new EditEnumTest(), "enum");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  function initForEntity(entity: EditEnumTest, field: "enum" | "enumMulti") {
    const formControl = testFormGroup.controls[field];
    formControl.setValue(entity[field]);

    component.onInitFromDynamicConfig({
      formControl: formControl,
      formFieldConfig: { id: field },
      propertySchema: entity.getSchema().get(field),
      entity: entity,
    });
  }
});
