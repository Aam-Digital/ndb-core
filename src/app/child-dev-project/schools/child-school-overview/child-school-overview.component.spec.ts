import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ChildSchoolOverviewComponent } from "./child-school-overview.component";
import { SimpleChange } from "@angular/core";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
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

  it("it calls children service with id from passed child", fakeAsync(() => {
    component.ngOnChanges({
      entity: new SimpleChange(undefined, testChild, false),
    });
    tick();
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "child",
      testChild.getId()
    );
  }));

  it("it detects mode and uses correct index to load data ", async () => {
    const testSchool = new School();

    component.entity = testSchool;
    await component.ngOnChanges({
      entity: new SimpleChange(undefined, testSchool, false),
    });

    expect(component.mode).toBe("school");
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      testSchool.getId()
    );
  });

  it("should allow to change the columns to be displayed by the config", fakeAsync(() => {
    const config: PanelConfig = {
      entity: new Child(),
      config: {
        single: true,
        columns: [
          { id: "schoolId", label: "Team", view: "school" },
          { id: "start", label: "From", view: "date" },
          { id: "end", label: "To", view: "date" },
        ],
      },
    };
    component.onInitFromDynamicConfig(config);
    tick();

    let columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).not.toContain("Class");
    expect(columnNames).not.toContain("Result");

    config.config.columns.push(
      {
        id: "schoolClass",
        label: "Class",
        input: "text",
      },
      {
        id: "result",
        label: "Result",
        input: "percentageResult",
      }
    );

    component.onInitFromDynamicConfig(config);
    tick();

    columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toEqual(
      jasmine.arrayContaining(["Team", "From", "To", "Class", "Result"])
    );
  }));

  it("should create a relation with the child ID", async () => {
    const existingRelation = new ChildSchoolRelation();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    mockChildrenService.queryRelationsOf.and.resolveTo([existingRelation]);

    const child = new Child();
    component.entity = child;
    await component.ngOnChanges({
      entity: new SimpleChange(undefined, component.entity, false),
    });

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day")
    ).toBeTrue();
  });

  it("should create a relation with the school ID", () => {
    component.entity = new School("testID");
    component.ngOnChanges({
      entity: new SimpleChange(undefined, component.entity, false),
    });

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

    await component.onInitFromDynamicConfig({ entity: school });

    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      school.getId()
    );
    expect(component.displayedRecords).toEqual([active1, active2]);
  });

  it("should show all relations if configured; with active ones being highlighted", async () => {
    mockChildrenService.queryRelationsOf.and.resolveTo([
      active1,
      active2,
      inactive,
    ]);

    await component.onInitFromDynamicConfig({
      entity: new School(),
      config: { showInactive: true },
    });

    expect(component.displayedRecords).toEqual([active1, active2, inactive]);
    expect(component.backgroundColorFn(active1)).not.toEqual("");
    expect(component.backgroundColorFn(inactive)).toEqual("");
  });
});
