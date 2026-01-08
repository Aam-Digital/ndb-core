import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "./automated-field-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

fdescribe("AutomatedFieldMappingComponent", () => {
  let component: AutomatedFieldMappingComponent;
  let fixture: ComponentFixture<AutomatedFieldMappingComponent>;

  const mockDialogData: AutomatedFieldMappingDialogData = {
    currentEntityType: TestEntity,
    sourceValueEntityType: TestEntity,
    currentField: TestEntity.schema.get("other") as FormFieldConfig,
    value: {
      sourceReferenceField: "ref",
      sourceValueField: undefined,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedFieldMappingComponent, MockedTestingModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            data: {
              currentEntityType: TestEntity,
              currentField: TestEntity.schema.get("category"),
              sourceValueEntityType: TestEntity,
              value: null,
            } as AutomatedFieldMappingDialogData,
          },
        },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutomatedFieldMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
