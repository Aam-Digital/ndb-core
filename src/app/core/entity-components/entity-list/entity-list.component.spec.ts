import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { SimpleChange } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BooleanFilterConfig, EntityListConfig } from "./EntityListConfig";
import { Entity } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { User } from "../../user/user";
import { SessionService } from "../../session/session-service/session.service";
import { ChildrenListComponent } from "../../../child-dev-project/children/children-list/children-list.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { Note } from "../../../child-dev-project/notes/model/note";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import { BackupService } from "../../admin/services/backup.service";
import { EntityListModule } from "./entity-list.module";
import { Angulartics2Module } from "angulartics2";
import { ExportDataDirective } from "../../admin/export-data/export-data.directive";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;
  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [
      { component: "DisplayText", title: "PN", id: "projectNumber" },
      { component: "ChildBlock", title: "Name", id: "name" },
      { component: "DisplayDate", title: "DoB", id: "dateOfBirth" },
      { component: "DisplayText", title: "Gender", id: "gender" },
      { component: "DisplayText", title: "Class", id: "schoolClass" },
      { component: "SchoolBlockWrapper", title: "School", id: "schoolId" },
      {
        component: "RecentAttendanceBlocks",
        title: "Attendance (School)",
        id: "school",
      },
    ],
    columnGroup: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "Basic Info",
          columns: ["projectNumber", "name", "age"],
        },
        {
          name: "School Info",
          columns: ["name", "schoolClass", "schoolId", "school"],
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

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockLoggingService = jasmine.createSpyObj(["warn"]);
      mockEntityMapper = jasmine.createSpyObj(["save"]);
      TestBed.configureTestingModule({
        declarations: [EntityListComponent, ExportDataDirective],
        imports: [
          CommonModule,
          NoopAnimationsModule,
          EntityListModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule.withRoutes([
            { path: "child", component: ChildrenListComponent },
          ]),
        ],
        providers: [
          { provide: SessionService, useValue: mockSessionService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: BackupService, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;
    component.listConfig = testConfig;
    component.ngOnChanges({
      entityList: new SimpleChange(null, component.entityList, false),
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
    expect(component.columnGroups).toEqual(testConfig.columnGroup.groups);
    const defaultGroupIndex = testConfig.columnGroup.groups.findIndex(
      (g) => g.name === testConfig.columnGroup.default
    );
    const defaultGroup = component.columnGroups[defaultGroupIndex];
    expect(component.selectedColumnGroupIndex).toEqual(defaultGroupIndex);
    expect(component.columnsToDisplay).toEqual(defaultGroup.columns);
  });

  it("should set the clicked column group", () => {
    component.ready = true;
    const clickedColumnGroup = testConfig.columnGroup.groups[0];
    component.selectedColumnGroupIndex = 0;
    expect(component.selectedColumnGroupIndex).toEqual(0);
    expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
  });

  it("should apply the clicked filter", (done) => {
    const clickedOption = "false";
    const child1 = new Child("dropoutId");
    child1.status = "Dropout";
    const child2 = new Child("activeId");
    component.entityList = [child1, child2];
    component.ngOnChanges({
      entityList: new SimpleChange(false, component.entityList, false),
    });
    setTimeout(() => {
      const activeFs = component.filterSelections[0];
      component.onFilterOptionSelected(activeFs, clickedOption);
      expect(component.filterSelections[0].selectedOption).toEqual(
        clickedOption
      );
      expect(component.entityList.length).toEqual(2);
      expect(component.entityDataSource.data.length).toEqual(1);
      expect(component.entityDataSource.data[0]).toEqual(child1);
      done();
    });
  });

  it("should navigate to the correct url params when clicking  a filter", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    const dropoutFs = component.filterSelections[0];
    const clickedOption = (testConfig.filters[0] as BooleanFilterConfig).false;
    const route = fixture.debugElement.injector.get(ActivatedRoute);
    component.onFilterOptionSelected(dropoutFs, clickedOption);
    const expectedParams = {};
    expectedParams[dropoutFs.filterSettings.name] = clickedOption;
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: expectedParams,
      queryParamsHandling: "merge",
    });
  });

  it("should filter a list of children", (done) => {
    const child1 = new Child("something");
    const child2 = new Child("uniqueString");
    component.entityList = [child1, child2];
    component.ngOnChanges({
      entityList: new SimpleChange(false, component.entityList, false),
    });
    setTimeout(() => {
      component.applyFilter("     UnIquEString    ");
      expect(component.entityDataSource.filter).toEqual("uniquestring");
      expect(component.entityDataSource.filteredData.length).toEqual(1);
      expect(component.entityDataSource.filteredData[0]).toEqual(child2);
      done();
    });
  });

  it("correctly create dropdown and selection filters if values are present", fakeAsync(() => {
    const child = new Child();
    child.religion = "muslim";
    component.entityList = [child];
    component.ngOnChanges({
      entityList: new SimpleChange(false, component.entityList, false),
    });
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
      addNew: testConfig.addNew,
      filterPlaceholder: testConfig.filterPlaceholder,
    };
    component.ngOnChanges({
      listConfig: new SimpleChange(false, component.listConfig, false),
      entityList: new SimpleChange(false, component.entityList, false),
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

  it("should apply default sort on first column", async () => {
    const children = [Child.create("C"), Child.create("A"), Child.create("B")];
    component.columnsToDisplay = ["name", "projectNumber"];
    component.entityList = children;

    // trigger ngOnChanges for manually updated property
    component.ngOnChanges({
      entityList: new SimpleChange(undefined, children, true),
    });

    expect(
      component.entityDataSource._orderData(children).map((c) => c["name"])
    ).toEqual(["A", "B", "C"]);
  });

  it("should apply default sort on first column, ordering dates descending", async () => {
    const children = [Child.create("0"), Child.create("1"), Child.create("2")];
    children[0].admissionDate = new Date(2010, 1, 1);
    children[1].admissionDate = new Date(2011, 1, 1);
    children[2].admissionDate = new Date(2012, 1, 1);

    component.columnsToDisplay = ["admissionDate", "name"];
    component.entityList = children;
    // define the columns to mark "admissionDate" as a Date value
    component.columns = [
      {
        component: "DisplayDate",
        title: "Admission",
        id: "admissionDate",
      },
      {
        component: "DisplayText",
        title: "Name",
        id: "name",
      },
    ];

    // trigger ngOnChanges for manually updated property
    component.ngOnChanges({
      entityList: new SimpleChange(undefined, children, true),
    });

    expect(
      component.entityDataSource._orderData(children).map((c) => c["name"])
    ).toEqual(["2", "1", "0"]);
  });

  it("should sort standard objects", () => {
    const children = [
      new Child("0"),
      new Child("1"),
      new Child("2"),
      new Child("3"),
    ];
    children[0].name = "AA";
    children[3].name = "AB";
    children[2].name = "Z";
    children[1].name = "C";
    component.entityList = children;
    component.sort.sort({ id: "name", start: "asc", disableClear: false });
    const sortedIds = component.entityDataSource
      .sortData(children, component.sort)
      .map((value) => value.getId());
    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });

  it("should sort non-standard objects", () => {
    const notes = [new Note("0"), new Note("1"), new Note("2"), new Note("3")];
    notes[0].category = { id: "0", label: "AA" };
    notes[3].category = { id: "1", label: "AB" };
    notes[2].category = { id: "2", label: "Z" };
    notes[1].category = { id: "3", label: "C" };
    component.ngOnInit();
    component.entityList = notes;
    component.sort.sort({ id: "category", start: "asc", disableClear: false });
    const sortedIds = component.entityDataSource
      .sortData(notes, component.sort)
      .map((note) => note.getId());
    expect(sortedIds).toEqual(["0", "3", "1", "2"]);
  });
});
