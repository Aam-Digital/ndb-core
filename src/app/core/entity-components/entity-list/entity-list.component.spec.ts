import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { BooleanFilterConfig, EntityListConfig } from "./EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityListModule } from "./entity-list.module";
import { DatabaseField } from "../../entity/database-field.decorator";
import { AttendanceService } from "../../../child-dev-project/attendance/attendance.service";
import { ExportService } from "../../export/export-service/export.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { EntityMapperService } from "../../entity/entity-mapper.service";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;
  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [
      { view: "DisplayText", label: "Age", id: "age" },
      {
        view: "RecentAttendanceBlocks",
        label: "Attendance (School)",
        id: "school",
        additional: {
          filterByActivityType: "SCHOOL_CLASS",
        },
      },
    ],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "Basic Info",
          columns: ["projectNumber", "name", "age", "gender", "religion"],
        },
        {
          name: "School Info",
          columns: ["name", "age", "school"],
        },
      ],
    },
    filters: [
      {
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Currently active children",
        false: "Currently inactive children",
        all: "All children",
      } as BooleanFilterConfig,
      {
        id: "center",
      },
      {
        id: "religion",
        display: "dropdown",
      },
    ],
  };
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let routeData: Subject<RouteData<EntityListConfig>>;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = jasmine.createSpyObj([
      "getActivitiesForChild",
      "getAllActivityAttendancesForPeriod",
    ]);
    mockAttendanceService.getActivitiesForChild.and.resolveTo([]);
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo([]);
    routeData = new Subject<RouteData<EntityListConfig>>();
    mockActivatedRoute = {
      component: undefined,
      queryParams: new Subject(),
      data: routeData,
      snapshot: { queryParams: {}, queryParamMap: new Map() } as any,
    };

    TestBed.configureTestingModule({
      imports: [
        EntityListModule,
        MockedTestingModule.withState(),
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: ExportService, useValue: {} },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  }));

  it("should create", () => {
    createComponent();
    initComponentInputs();
    expect(component).toBeTruthy();
  });

  it("should creates columns from config", () => {
    createComponent();
    initComponentInputs();
    expect(component.columns).toEqual(testConfig.columns);
  });

  it("should create column groups from config and set correct one", () => {
    createComponent();
    initComponentInputs();
    expect(component.columnGroups).toEqual(testConfig.columnGroups.groups);
    const defaultGroup = testConfig.columnGroups.groups.findIndex(
      (g) => g.name === testConfig.columnGroups.default
    );
    expect(component.selectedColumnGroupIndex).toEqual(defaultGroup);
    expect(component.columnsToDisplay).toEqual(
      testConfig.columnGroups.groups[defaultGroup].columns
    );
  });

  it("should set the clicked column group", () => {
    createComponent();
    initComponentInputs();
    const clickedColumnGroup = testConfig.columnGroups.groups[0];
    component.columnGroupClick(clickedColumnGroup.name);
    expect(component.selectedColumnGroupIndex).toEqual(0);
    expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
  });

  it("should apply the clicked filter", fakeAsync(() => {
    createComponent();
    initComponentInputs();
    const clickedOption = "false";
    const child1 = new Child("dropoutId");
    child1.status = "Dropout";
    const child2 = new Child("activeId");
    component.allEntities = [child1, child2];

    component.ngOnChanges({ allEntities: null });
    tick();

    const activeFs = component.filterSelections[0];
    component.filterOptionSelected(activeFs, clickedOption);
    fixture.detectChanges();
    expect(component.filterSelections[0].selectedOption).toEqual(clickedOption);
    expect(component.allEntities).toHaveSize(2);
    expect(component.entityTable.recordsDataSource.data).toHaveSize(1);
    expect(component.entityTable.recordsDataSource.data[0].record).toEqual(
      child1
    );
    flush();
    discardPeriodicTasks();
  }));

  it("should add and initialize columns which are only mentioned in the columnGroups", () => {
    createComponent();
    initComponentInputs();

    class Test extends Entity {
      @DatabaseField({ label: "Test Property" }) testProperty: string;
    }

    component.entityConstructor = Test;
    component.listConfig = {
      title: "",
      columns: [
        {
          id: "anotherColumn",
          label: "Predefined Title",
          view: "DisplayDate",
        },
      ],
      columnGroups: {
        groups: [
          { name: "One", columns: ["anotherColumn"] },
          { name: "Both", columns: ["testProperty", "anotherColumn"] },
        ],
      },
    };

    component.ngOnChanges({ listConfig: null });

    expect(
      component.columns.map((col) => (typeof col === "string" ? col : col.id))
    ).toEqual(
      jasmine.arrayWithExactContents(["testProperty", "anotherColumn"])
    );
  });

  it("should create records of the correct entity", () => {
    createComponent();
    initComponentInputs();
    component.entityConstructor = Child;

    const res = component.getNewRecordFactory()();

    expect(res).toHaveType(Child.ENTITY_TYPE);
  });

  it("should automatically initialize values if directly referenced from config", fakeAsync(() => {
    mockActivatedRoute.component = EntityListComponent;
    const config = {
      entity: "Child",
      title: "Some title",
      columns: ["name", "gender"],
    };
    const entityMapper = TestBed.inject(EntityMapperService);
    const children = [new Child(), new Child()];
    spyOn(entityMapper, "loadType").and.resolveTo(children);

    createComponent();
    routeData.next({ config });
    tick();

    expect(component.entityConstructor).toBe(Child);
    expect(component.listConfig).toEqual(config);
    expect(component.allEntities).toEqual(children);
    expect(component.listName).toBe("Some title");

    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    component.addNewClick.emit();
    expect(navigateSpy.calls.mostRecent().args[0]).toEqual(["new"]);
    component.elementClick.emit(new Child("clickedId"));
    expect(navigateSpy.calls.mostRecent().args[0]).toEqual(["clickedId"]);
  }));

  function createComponent() {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function initComponentInputs() {
    component.listConfig = testConfig;
    component.entityConstructor = Child;
    component.ngOnChanges({ allEntities: undefined, listConfig: undefined });
    fixture.detectChanges();
  }
});
