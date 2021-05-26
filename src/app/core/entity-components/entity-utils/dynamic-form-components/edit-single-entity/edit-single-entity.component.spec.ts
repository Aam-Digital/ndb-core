import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { EntityFormModule } from "../../../entity-form/entity-form.module";
import { FormControl } from "@angular/forms";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { EntityFormService } from "../../../entity-form/entity-form.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChildSchoolRelation } from "../../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../../child-dev-project/schools/model/school";

describe("EditSingleEntityComponent", () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [EntityFormModule, NoopAnimationsModule],
      declarations: [EditSingleEntityComponent],
      providers: [
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSingleEntityComponent);
    component = fixture.componentInstance;
    const entityFormService = TestBed.inject(EntityFormService);
    component.formControl = entityFormService
      .createFormGroup([{ id: "schoolId" }], new ChildSchoolRelation())
      .get("schoolId") as FormControl;
    component.formControlName = "schoolId";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", fakeAsync(() => {
    const school1 = new School();
    school1.name = "First School";
    const school2 = new School();
    school2.name = "Second School";
    mockEntityMapper.loadType.and.resolveTo([school1, school2]);

    component.onInitFromDynamicConfig({
      formFieldConfig: { id: "schoolId" },
      formControl: component.formControl,
      propertySchema: ChildSchoolRelation.schema.get("schoolId"),
    });
    tick();

    expect(mockEntityMapper.loadType).toHaveBeenCalled();
    expect(component.entities).toEqual([school1, school2]);
  }));
});
