import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { ChildSchoolRelation } from "../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../child-dev-project/schools/model/school";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { FormControl } from "@angular/forms";
import { Child } from "../../../../child-dev-project/children/model/child";
import { LoggingService } from "../../../logging/logging.service";

describe("EditSingleEntityComponent", () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;
  let entityMapper: EntityMapperService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditSingleEntityComponent, MockedTestingModule.withState()],
      providers: [EntityFormService],
    }).compileComponents();
    entityMapper = TestBed.inject(EntityMapperService);
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
    component.entity = new ChildSchoolRelation();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load all entities of the given type as options", async () => {
    const school1 = School.create({ name: "First School" });
    const school2 = School.create({ name: "Second School " });
    await entityMapper.saveAll([school1, school2]);
    component.formFieldConfig.additional = School.ENTITY_TYPE;

    await component.ngOnInit();

    expect(component.entities).toEqual(
      jasmine.arrayWithExactContents([school1, school2]),
    );
  });

  it("should add selected entity of a not-configured type to available entities", async () => {
    const someSchools = [new School(), new School()];
    const selectedChild = new Child();
    await entityMapper.saveAll(someSchools.concat(selectedChild));
    component.formFieldConfig.additional = School.ENTITY_TYPE;
    component.formControl.setValue(selectedChild.getId());

    await component.ngOnInit();

    expect(component.entities).toEqual(
      jasmine.arrayWithExactContents(someSchools.concat(selectedChild)),
    );
  });

  it("should log warning if entity is selected that cannot be found", async () => {
    const warnSpy = spyOn(TestBed.inject(LoggingService), "warn");
    component.formFieldConfig.additional = Child.ENTITY_TYPE;
    component.formControl.setValue("missing_child");

    await component.ngOnInit();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("missing_child"),
    );
  });
});
