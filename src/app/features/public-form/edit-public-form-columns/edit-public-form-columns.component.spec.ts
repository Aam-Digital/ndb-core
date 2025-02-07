import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPublicFormColumnsComponent } from "./edit-public-form-columns.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { FormControl } from "@angular/forms";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { FieldGroup } from "../../../core/entity-details/form/field-group";

describe("EditPublicFormColumnsComponent", () => {
  let component: EditPublicFormColumnsComponent;
  let fixture: ComponentFixture<EditPublicFormColumnsComponent>;
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
    component.formControl = new FormControl();
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should migrate old columns config to new columns config", () => {
    component.formControl.setValue(oldColumnConfig as any);

    component.ngOnInit();

    expect(component.formConfig.fieldGroups).toEqual(newColumnConfig);
  });
});
