import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminRelatedEntityDetailsComponent } from "./admin-related-entity-details.component";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { EntityForm } from "../../../common-components/entity-form/entity-form";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { SyncStateSubject } from "../../../session/session-type";
import { CurrentUserSubject } from "../../../session/current-user-subject";
import { FormConfig } from "../../../entity-details/form/form.component";
import { FieldGroup } from "../../../entity-details/form/field-group";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let fixture: ComponentFixture<AdminRelatedEntityDetailsComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;

  @DatabaseEntity("TestEntity")
  class TestEntity extends Entity {
    name: string;
    description: string;
  }

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );

    await TestBed.configureTestingModule({
      imports: [AdminRelatedEntityDetailsComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        SyncStateSubject,
        CurrentUserSubject,
        EntityRegistry,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRelatedEntityDetailsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize form config from columns", () => {
    component.columns = [{ id: "name" }, { id: "description" }];
    component.ngOnInit();

    expect(component.formConfig.fieldGroups).toHaveSize(1);
    expect(component.formConfig.fieldGroups[0].fields).toEqual([
      "name",
      "description",
    ]);
  });

  it("should update columns when form config changes", () => {
    const mockFormConfig: FormConfig = {
      fieldGroups: [
        {
          fields: ["name", "description"],
          header: "Fields for popup form",
        } as FieldGroup,
      ],
    };

    component.columns = [];
    component.onFormConfigChange(mockFormConfig);

    expect(component.columns).toEqual([{ id: "name" }, { id: "description" }]);
  });

  it("should preserve existing column configuration", () => {
    component.columns = [
      { id: "name", visibleFrom: "md" },
      { id: "description" },
    ];

    const mockFormConfig: FormConfig = {
      fieldGroups: [
        {
          fields: ["name", "description"],
          header: "Fields for popup form",
        } as FieldGroup,
      ],
    };

    component.onFormConfigChange(mockFormConfig);

    expect(component.columns).toEqual([
      { id: "name", visibleFrom: "md" },
      { id: "description" },
    ]);
  });
});
