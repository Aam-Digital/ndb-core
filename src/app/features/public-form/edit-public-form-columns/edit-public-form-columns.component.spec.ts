import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { EditPublicFormColumnsComponent } from "./edit-public-form-columns.component";
import { PublicFormsService } from "../public-forms.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { PublicFormConfig } from "../public-form-config";

describe("EditPublicFormColumnsComponent", () => {
  let component: EditPublicFormColumnsComponent;
  let fixture: ComponentFixture<EditPublicFormColumnsComponent>;
  let formGroup: FormGroup;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;
  let mockPublicFormsService: jasmine.SpyObj<PublicFormsService>;

  const testColumns = [
    {
      fields: ["name", "phone"],
    },
  ];

  const oldColumnConfig: string[][] = [["name", "gender"], ["other"]];
  const newColumnConfig: FieldGroup[] = [
    { fields: ["name", "gender"], header: null },
    { fields: ["other"], header: null },
  ];

  beforeEach(() => {
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
      "extendFormFieldConfig",
    ]);
    mockPublicFormsService = jasmine.createSpyObj("PublicFormsService", [
      "initCustomFormActions",
    ]);

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        EditPublicFormColumnsComponent,
        NoopAnimationsModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: EntityFormService, useValue: mockEntityFormService },
        { provide: PublicFormsService, useValue: mockPublicFormsService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPublicFormColumnsComponent);
    component = fixture.componentInstance;

    const publicFormConfig = new PublicFormConfig();
    publicFormConfig.entity = TestEntity.ENTITY_TYPE;
    publicFormConfig.columns = testColumns;

    component.entity = publicFormConfig;
    formGroup = setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should migrate old columns config to new columns config", () => {
    const control = formGroup.get("testProperty") as FormControl;
    control.setValue(oldColumnConfig as any);

    component.ngOnInit();

    expect(component.formConfig.fieldGroups).toEqual(newColumnConfig);
  });
});
