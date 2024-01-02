import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildSchoolOverviewComponent } from "./child-school-overview.component";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { School } from "../model/school";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

describe("ChildSchoolOverviewComponent", () => {
  let component: ChildSchoolOverviewComponent;
  let fixture: ComponentFixture<ChildSchoolOverviewComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const testChild = new Child("22");
  const inactive = new ChildSchoolRelation("r2");
  inactive.end = moment().subtract("1", "week").toDate();

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([
      new ChildSchoolRelation(),
    ]);

    TestBed.configureTestingModule({
      imports: [ChildSchoolOverviewComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildSchoolOverviewComponent);
    component = fixture.componentInstance;
    component.entity = testChild;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("it calls children service with id from passed child", async () => {
    await component.ngOnInit();
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      testChild.getId(),
    );
  });

  it("it detects mode and uses correct index to load data ", async () => {
    const testSchool = new School();

    component.entity = testSchool;
    await component.ngOnInit();

    expect(component.mode).toBe("school");
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      testSchool.getId(),
    );
  });

  it("should create a relation with the child ID", async () => {
    const existingRelation = new ChildSchoolRelation();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    mockChildrenService.queryRelationsOf.and.resolveTo([existingRelation]);

    const child = new Child();
    component.entity = child;
    await component.ngOnInit();

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day"),
    ).toBeTrue();
  });

  it("should create a relation with the school ID", () => {
    component.entity = new School("testID");
    component.ngOnInit();

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation).toBeInstanceOf(ChildSchoolRelation);
    expect(newRelation.schoolId).toBe("School:testID");
  });
});
