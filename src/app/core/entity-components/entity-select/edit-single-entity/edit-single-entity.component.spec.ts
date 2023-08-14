import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { ChildSchoolRelation } from "../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../child-dev-project/schools/model/school";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { FormControl } from "@angular/forms";

describe("EditSingleEntityComponent", () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;
  let loadTypeSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditSingleEntityComponent, MockedTestingModule.withState()],
      providers: [EntityFormService],
    }).compileComponents();
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSingleEntityComponent);
    component = fixture.componentInstance;
    const entityFormService = TestBed.inject(EntityFormService);
    component.parent = entityFormService.createFormGroup(
      [{ id: "schoolId" }],
      new ChildSchoolRelation(),
    );
    component.formControl = component.parent.get(
      "schoolId",
    ) as FormControl<string>;
    component.formControlName = "schoolId";
    component.formFieldConfig = { id: "childId" };
    component.propertySchema = ChildSchoolRelation.schema.get("childId");
    component.entity = new ChildSchoolRelation();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load all entities of the given type as options", async () => {
    const school1 = School.create({ name: "First School" });
    const school2 = School.create({ name: "Second School " });
    loadTypeSpy.and.resolveTo([school1, school2]);

    await component.ngOnInit();

    expect(loadTypeSpy).toHaveBeenCalled();
    expect(component.entities).toEqual([school1, school2]);
  });
});
