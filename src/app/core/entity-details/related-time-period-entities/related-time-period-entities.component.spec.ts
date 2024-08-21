import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { RelatedTimePeriodEntitiesComponent } from "./related-time-period-entities.component";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { entityRegistry } from "../../entity/database-entity.decorator";

describe("RelatedTimePeriodEntitiesComponent", () => {
  let component: RelatedTimePeriodEntitiesComponent<ChildSchoolRelation>;
  let fixture: ComponentFixture<
    RelatedTimePeriodEntitiesComponent<ChildSchoolRelation>
  >;

  let entityMapper: EntityMapperService;

  let mainEntity: TestEntity;
  const entityType = "ChildSchoolRelation";

  let active1, active2, inactive: ChildSchoolRelation;

  beforeEach(waitForAsync(() => {
    entityRegistry
      .get(ChildSchoolRelation.ENTITY_TYPE)
      .schema.get("childId").additional = TestEntity.ENTITY_TYPE;

    mainEntity = new TestEntity("22");
    active1 = new ChildSchoolRelation("a1");
    active1.childId = mainEntity.getId();
    active2 = new ChildSchoolRelation("a2");
    active2.childId = mainEntity.getId();
    inactive = new ChildSchoolRelation("i1");
    inactive.childId = mainEntity.getId();
    inactive.end = moment().subtract("1", "week").toDate();

    TestBed.configureTestingModule({
      imports: [
        RelatedTimePeriodEntitiesComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);

    fixture = TestBed.createComponent(
      RelatedTimePeriodEntitiesComponent<ChildSchoolRelation>,
    );
    component = fixture.componentInstance;

    component.entity = mainEntity;
    component.entityType = entityType;

    fixture.detectChanges();
  }));

  afterEach(() => {
    entityRegistry
      .get(ChildSchoolRelation.ENTITY_TYPE)
      .schema.get("childId").additional = "Child";
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change columns to be displayed via config", async () => {
    component.entity = new TestEntity();
    component.single = true;
    component.columns = [
      { id: "schoolId", label: "Team", viewComponent: "school" },
      { id: "start", label: "From", viewComponent: "date" },
      { id: "end", label: "To", viewComponent: "date" },
    ];
    await component.ngOnInit();

    let columnNames = component._columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).not.toContain("Class");
    expect(columnNames).not.toContain("Result");

    component._columns.push(
      { id: "schoolClass", label: "Class", viewComponent: "text" },
      { id: "result", label: "Result", viewComponent: "percentageResult" },
    );

    await component.ngOnInit();

    columnNames = component._columns.map((column) => column.label);
    expect(columnNames).toEqual(
      jasmine.arrayContaining(["Team", "From", "To", "Class", "Result"]),
    );
  });

  it("should create a new entity with the main entity's id linked", async () => {
    const child = new TestEntity();
    component.entity = child;
    await component.ngOnInit();

    const newRelation = component.createNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
  });

  it("should create a new entity with the start date inferred from previous relations", async () => {
    const child = new TestEntity();
    const existingRelation = new ChildSchoolRelation();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    existingRelation.childId = child.getId();
    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([existingRelation]);

    component.entity = child;
    await component.ngOnInit();

    const newRelation = component.createNewRecordFactory()();

    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day"),
    ).toBeTrue();
  });

  it("should show all relations if configured; with active ones being highlighted", fakeAsync(() => {
    const loadType = spyOn(entityMapper, "loadType");
    loadType.and.resolveTo([active1, active2, inactive]);

    component.showInactive = true;
    component.ngOnInit();
    tick();

    expect(component.backgroundColorFn(active1)).not.toEqual("");
    expect(component.backgroundColorFn(inactive)).toEqual("");
  }));
});
