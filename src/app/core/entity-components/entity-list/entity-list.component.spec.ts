import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { CommonModule, DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { SimpleChange } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BooleanFilterConfig, EntityListConfig } from "./EntityListConfig";
import { Entity } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { User } from "../../user/user";
import { SessionService } from "../../session/session-service/session.service";
import { ExportDataComponent } from "../../admin/export-data/export-data.component";
import { ChildrenListComponent } from "../../../child-dev-project/children/children-list/children-list.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import { BackupService } from "../../admin/services/backup.service";
import { EntityListModule } from "./entity-list.module";
import { Angulartics2Module } from "angulartics2";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DatabaseField } from "../../entity/database-field.decorator";
import { ReactiveFormsModule } from "@angular/forms";
import { AttendanceService } from "../../../child-dev-project/attendance/attendance.service";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;
  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [
      { view: "DisplayText", placeholder: "Age", id: "age" },
      {
        view: "RecentAttendanceBlocks",
        placeholder: "Attendance (School)",
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
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockEntitySchemaService: jasmine.SpyObj<EntitySchemaService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockLoggingService = jasmine.createSpyObj(["warn"]);
      mockEntityMapper = jasmine.createSpyObj(["save"]);
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
        declarations: [EntityListComponent, ExportDataComponent],
        imports: [
          CommonModule,
          NoopAnimationsModule,
          EntityListModule,
          Angulartics2Module.forRoot(),
          ReactiveFormsModule,
          RouterTestingModule.withRoutes([
            { path: "child", component: ChildrenListComponent },
          ]),
        ],
        providers: [
          DatePipe,
          { provide: SessionService, useValue: mockSessionService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: BackupService, useValue: {} },
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
    const defaultGroup = testConfig.columnGroups.groups.find(
      (g) => g.name === testConfig.columnGroups.default
    );
    expect(component.selectedColumnGroup).toEqual(defaultGroup.name);
    expect(component.columnsToDisplay).toEqual(defaultGroup.columns);
  });

  it("should set the clicked column group", () => {
    component.ready = true;
    const clickedColumnGroup = testConfig.columnGroups.groups[0];
    component.columnGroupClick(clickedColumnGroup.name);
    expect(component.selectedColumnGroup).toEqual(clickedColumnGroup.name);
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
      expect(component.allEntities.length).toEqual(2);
      expect(component.filteredEntities.length).toEqual(1);
      expect(component.filteredEntities[0]).toEqual(child1);
      done();
    });
  });

  it("should navigate to the correct url params when clicking  a filter", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    console.log("component", component.filterSelections);
    const dropoutFs = component.filterSelections[0];
    const clickedOption = (testConfig.filters[0] as BooleanFilterConfig).false;
    const route = TestBed.inject(ActivatedRoute);

    component.filterOptionSelected(dropoutFs, clickedOption);

    const expectedParams = {};
    expectedParams[dropoutFs.filterSettings.name] = clickedOption;
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: expectedParams,
      queryParamsHandling: "merge",
    });
  });

  it("correctly create dropdown and selection filters if values are present", fakeAsync(() => {
    const child = new Child();
    child.religion = "muslim";
    component.allEntities = [child];
    component.ngOnChanges({ allEntities: null });
    expect(component.filterSelections.length).toEqual(2);
    expect(
      component.filterSelections
        .filter((e) => e.display !== "dropdown")
        .map((e) => e.filterSettings.name)
    ).toEqual(["isActive"]);
    expect(
      component.filterSelections
        .filter((e) => e.display === "dropdown")
        .map((e) => e.filterSettings.name)
    ).toEqual(["religion"]);
  }));

  it("should create default column groups and filters", () => {
    component.listConfig = {
      title: testConfig.title,
      columns: testConfig.columns,
    };
    component.ngOnChanges({
      listConfig: new SimpleChange(false, component.listConfig, false),
      allEntities: new SimpleChange(false, component.allEntities, false),
    });
    expect(component.columnGroups).toEqual([
      { name: "default", columns: testConfig.columns.map((c) => c.id) },
    ]);
    expect(component.defaultColumnGroup).toEqual(
      component.columnGroups[0].name
    );
    expect(component.mobileColumnGroup).toEqual(component.columnGroups[0].name);
    expect(component.filtersConfig).toEqual([]);
    expect(component.filterSelections).toEqual([]);
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
          placeholder: "Predefined Title",
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

    expect(component.columns.map((col) => col.id)).toEqual(
      jasmine.arrayWithExactContents(["testProperty", "anotherColumn"])
    );
  });
});
