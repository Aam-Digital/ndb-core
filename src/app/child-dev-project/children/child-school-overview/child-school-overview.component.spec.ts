import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ChildSchoolOverviewComponent } from "./child-school-overview.component";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

describe("ChildSchoolOverviewComponent", () => {
  let component: ChildSchoolOverviewComponent;
  let fixture: ComponentFixture<ChildSchoolOverviewComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelations"]);
    mockChildrenService.queryRelations.and.resolveTo([
      new ChildSchoolRelation(),
    ]);

    TestBed.configureTestingModule({
      imports: [ChildSchoolOverviewComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ChildSchoolOverviewComponent);
    component = fixture.componentInstance;
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("it calls children service with id from passed child", fakeAsync(() => {
    component.entity = new Child();

    fixture.detectChanges();
    tick();

    expect(mockChildrenService.queryRelations).toHaveBeenCalledWith(
      component.entity.getId(),
    );
  }));

  it("it detects mode and uses correct index to load data ", fakeAsync(() => {
    const testSchool = createEntityOfType("School");

    component.entity = testSchool;
    fixture.detectChanges();
    tick();

    expect(component.mode).toBe("school");
    expect(mockChildrenService.queryRelations).toHaveBeenCalledWith(
      testSchool.getId(),
    );
  }));

  it("should create a relation with the child ID", fakeAsync(() => {
    const child = new Child();
    const existingRelation = new ChildSchoolRelation();
    existingRelation.childId = child.getId();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    mockChildrenService.queryRelations.and.resolveTo([existingRelation]);

    component.entity = child;
    fixture.detectChanges();
    tick();

    const newRelation = component.createNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day"),
    ).toBeTrue();
  }));

  it("should create a relation with the school ID", fakeAsync(() => {
    component.entity = createEntityOfType("School", "testID");
    //component.entity.getSchema().get;
    fixture.detectChanges();
    tick();

    const newRelation = component.createNewRecordFactory()();

    expect(newRelation).toBeInstanceOf(ChildSchoolRelation);
    expect(newRelation.schoolId).toBe("School:testID");
  }));

  it("should show archived school in 'child' mode", fakeAsync(() => {
    component.entity = new Child();

    fixture.detectChanges();
    tick();

    expect(component.showInactive).toBeTrue();
  }));

  it("should not show archived children in 'school' mode", fakeAsync(() => {
    component.entity = createEntityOfType("School");

    fixture.detectChanges();
    tick();

    expect(component.showInactive).toBeFalse();
  }));
});
