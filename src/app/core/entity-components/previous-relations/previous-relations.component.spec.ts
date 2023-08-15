import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PreviousRelationsComponent } from "./previous-relations.component";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";

// TODO: re-write tests
describe("PreviousRelationsComponent", () => {
  let component: PreviousRelationsComponent<ChildSchoolRelation>;
  let fixture: ComponentFixture<
    PreviousRelationsComponent<ChildSchoolRelation>
  >;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const testChild = new Child("22");
  const school = new School("s1");
  const active1 = new ChildSchoolRelation("r1");
  const active2 = new ChildSchoolRelation("r2");
  const inactive = new ChildSchoolRelation("r2");
  inactive.end = moment().subtract("1", "week").toDate();

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([
      new ChildSchoolRelation(),
    ]);

    TestBed.configureTestingModule({
      imports: [PreviousRelationsComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PreviousRelationsComponent<ChildSchoolRelation>,
    );
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
      "child",
      testChild.getId(),
    );
  });

  it("it detects mode and uses correct index to load data ", async () => {
    const testSchool = new School();

    component.entity = testSchool;
    await component.ngOnInit();

    expect(component.mode).toBe("school");
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      testSchool.getId(),
    );
  });

  it("should allow to change the columns to be displayed by the config", async () => {
    component.entity = new Child();
    component.single = true;
    component.columns = [
      { id: "schoolId", label: "Team", view: "school" },
      { id: "start", label: "From", view: "date" },
      { id: "end", label: "To", view: "date" },
    ];
    await component.ngOnInit();

    let columnNames = component._columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).not.toContain("Class");
    expect(columnNames).not.toContain("Result");

    component._columns.push(
      { id: "schoolClass", label: "Class", view: "text" },
      { id: "result", label: "Result", view: "percentageResult" },
    );

    await component.ngOnInit();

    columnNames = component._columns.map((column) => column.label);
    expect(columnNames).toEqual(
      jasmine.arrayContaining(["Team", "From", "To", "Class", "Result"]),
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
    expect(newRelation.schoolId).toBe("testID");
  });

  it("should on default only show active relations", async () => {
    mockChildrenService.queryRelationsOf.and.resolveTo([
      active1,
      active2,
      inactive,
    ]);

    component.entity = school;
    await component.ngOnInit();

    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      school.getId(),
    );
    expect(component.displayedData).toEqual([active1, active2]);
  });

  it("should show all relations if configured; with active ones being highlighted", async () => {
    mockChildrenService.queryRelationsOf.and.resolveTo([
      active1,
      active2,
      inactive,
    ]);

    component.entity = new School();
    component.showInactive = true;
    await component.ngOnInit();

    expect(component.displayedData).toEqual([active1, active2, inactive]);
    expect(component.backgroundColorFn(active1)).not.toEqual("");
    expect(component.backgroundColorFn(inactive)).toEqual("");
  });
});
