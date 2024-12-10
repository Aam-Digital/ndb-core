import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPublicFormColumnsComponent } from "./edit-public-form-columns.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { FormControl } from "@angular/forms";
import { Database } from "app/core/database/database";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditPublicFormColumnsComponent", () => {
  let component: EditPublicFormColumnsComponent;
  let fixture: ComponentFixture<EditPublicFormColumnsComponent>;
  let mockEntityRegistry: Partial<EntityRegistry>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  const testColumns = [
    {
      fields: ["name", "phone"],
    },
  ];
  beforeEach(() => {
    let mockDatabase: jasmine.SpyObj<Database>;
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
        { provide: Database, useValue: mockDatabase },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
        { provide: EntityFormService, useValue: mockEntityFormService },
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
});
