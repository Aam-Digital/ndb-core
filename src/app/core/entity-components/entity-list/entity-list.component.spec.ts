import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { SimpleChange } from "@angular/core";
import { BooleanFilterConfig, EntityListConfig } from "./EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { Child } from "../../../child-dev-project/children/model/child";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import { EntityListModule } from "./entity-list.module";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DatabaseField } from "../../entity/database-field.decorator";
import { AttendanceService } from "../../../child-dev-project/attendance/attendance.service";
import { ExportService } from "../../export/export-service/export.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

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
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockEntitySchemaService: jasmine.SpyObj<EntitySchemaService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(
    waitForAsync(() => {
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockLoggingService = jasmine.createSpyObj(["warn"]);
      mockEntitySchemaService = jasmine.createSpyObj([
        "getComponent",
        "registerSchemaDatatype",
      ]);
      mockAttendanceService = jasmine.createSpyObj([
        "getActivitiesForChild",
        "getAllActivityAttendancesForPeriod",
      ]);
      mockAttendanceService.getActivitiesForChild.and.resolveTo([]);
      mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo(
        []
      );

      TestBed.configureTestingModule({
        imports: [
          EntityListModule,
          MockedTestingModule.withState(),
          FontAwesomeTestingModule,
        ],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: ExportService, useValue: {} },
          { provide: EntitySchemaService, useValue: mockEntitySchemaService },
          { provide: AttendanceService, useValue: mockAttendanceService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;
    component.listConfig = testConfig;
    component.entityConstructor = Child;
    component.ngOnChanges({
      allEntities: new SimpleChange(null, component.allEntities, false),
      listConfig: new SimpleChange(null, component.listConfig, false),
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should creates columns from config", () => {
    expect(component.columns).toEqual(testConfig.columns);
  });

  it("should create column groups from config and set correct one", () => {
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
    const clickedColumnGroup = testConfig.columnGroups.groups[0];
    component.columnGroupClick(clickedColumnGroup.name);
    expect(component.selectedColumnGroupIndex).toEqual(0);
    expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
  });

  it("should apply the clicked filter", (done) => {
    const clickedOption = "false";
    const child1 = new Child("dropoutId");
    child1.status = "Dropout";
    const child2 = new Child("activeId");
    component.allEntities = [child1, child2];
    component.ngOnChanges({ allEntities: null });
    setTimeout(() => {
      const activeFs = component.filterSelections[0];
      component.filterOptionSelected(activeFs, clickedOption);
      expect(component.filterSelections[0].selectedOption).toEqual(
        clickedOption
      );
      expect(component.allEntities).toHaveSize(2);
      expect(component.filteredEntities).toHaveSize(1);
      expect(component.filteredEntities[0]).toEqual(child1);
      done();
    });
  });

  it("should add and initialize columns which are only mentioned in the columnGroups", () => {
    class Test extends Entity {
      @DatabaseField({ label: "Test Property" }) testProperty: string;
    }
    component.entityConstructor = Test;
    mockEntitySchemaService.getComponent.and.returnValue("DisplayText");
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
    component.entityConstructor = Child;

    const res = component.getNewRecordFactory()();

    expect(res).toHaveType(Child.ENTITY_TYPE);
  });
});
