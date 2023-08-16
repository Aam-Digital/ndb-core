import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PreviousRelationsComponent } from "./previous-relations.component";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { FilterService } from "../../filter/filter.service";

describe("PreviousRelationsComponent", () => {
  let component: PreviousRelationsComponent<ChildSchoolRelation>;
  let fixture: ComponentFixture<
    PreviousRelationsComponent<ChildSchoolRelation>
  >;

  let entityMapper: EntityMapperService;

  function getFilteredData(comp: PreviousRelationsComponent<any>) {
    const filterPredicate = TestBed.inject(FilterService).getFilterPredicate(
      comp.filter,
    );
    return comp.data.filter(filterPredicate);
  }

  let mainEntity: Child;
  const entityType = "ChildSchoolRelation";
  const property = "childId";

  let active1, active2, inactive: ChildSchoolRelation;

  beforeEach(waitForAsync(() => {
    mainEntity = new Child("22");
    active1 = new ChildSchoolRelation("a1");
    active1.childId = mainEntity.getId();
    active2 = new ChildSchoolRelation("a2");
    active2.childId = mainEntity.getId();
    inactive = new ChildSchoolRelation("i1");
    inactive.childId = mainEntity.getId();
    inactive.end = moment().subtract("1", "week").toDate();

    TestBed.configureTestingModule({
      imports: [PreviousRelationsComponent, MockedTestingModule.withState()],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PreviousRelationsComponent<ChildSchoolRelation>,
    );
    component = fixture.componentInstance;

    component.entity = mainEntity;
    component.entityType = entityType;
    component.property = property;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load data correctly filtered data", async () => {
    const testSchool = new School();
    active1.schoolId = testSchool.getId();
    active2.schoolId = "some-other-id";
    inactive.schoolId = "some-other-id";

    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([active1, active2, inactive]);

    component.entity = testSchool;
    component.property = "schoolId";
    await component.ngOnInit();

    expect(getFilteredData(component)).toEqual([active1]);
  });

  it("should change columns to be displayed via config", async () => {
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

  it("should create a new entity with the main entity's id linked", async () => {
    const child = new Child();
    component.entity = child;
    await component.ngOnInit();

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
  });

  it("should create a new entity with the start date inferred from previous relations", async () => {
    const existingRelation = new ChildSchoolRelation();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([existingRelation]);

    const child = new Child();
    component.entity = child;
    await component.ngOnInit();

    const newRelation = component.generateNewRecordFactory()();

    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day"),
    ).toBeTrue();
  });

  it("should only show active relations by default", async () => {
    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([active1, active2, inactive]);

    await component.ngOnInit();

    expect(loadType).toHaveBeenCalledWith("ChildSchoolRelation");
    expect(getFilteredData(component)).toEqual([active1, active2]);
  });

  it("should show all relations if configured; with active ones being highlighted", async () => {
    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([active1, active2, inactive]);

    component.showInactive = true;
    await component.ngOnInit();

    expect(getFilteredData(component)).toEqual([active1, active2, inactive]);
    expect(component.backgroundColorFn(active1)).not.toEqual("");
    expect(component.backgroundColorFn(inactive)).toEqual("");
  });
});
