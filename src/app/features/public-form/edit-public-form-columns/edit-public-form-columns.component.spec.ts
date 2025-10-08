import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { EditPublicFormColumnsComponent } from "./edit-public-form-columns.component";

describe("EditPublicFormColumnsComponent", () => {
  let component: EditPublicFormColumnsComponent;
  let fixture: ComponentFixture<EditPublicFormColumnsComponent>;
  let formGroup: FormGroup;
  let mockEntityRegistry: Partial<EntityRegistry>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;
  let entityMapper: MockEntityMapperService;

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
    mockEntityRegistry = {
      get: jasmine.createSpy("get").and.returnValue(Entity),
    };

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        EditPublicFormColumnsComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: mockEntityRegistry },
        { provide: EntityFormService, useValue: mockEntityFormService },
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPublicFormColumnsComponent);
    component = fixture.componentInstance;
    component.entity = new TestEntity();
    component.entity["columns"] = testColumns;
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
