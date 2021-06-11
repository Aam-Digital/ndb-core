import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { ChildrenListComponent } from "./children-list.component";
import { ChildrenService } from "../children.service";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionService } from "../../../core/session/session-service/session.service";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { ChildrenModule } from "../children.module";
import { Angulartics2Module } from "angulartics2";
import { Child } from "../model/child";
import {
  BooleanFilterConfig,
  EntityListConfig,
  PrebuiltFilterConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { User } from "../../../core/user/user";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../../schools/model/school";
import { LoggingService } from "../../../core/logging/logging.service";
import { BackupService } from "../../../core/admin/services/backup.service";
import { ExportDataDirective } from "../../../core/admin/export-data/export-data.directive";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeData: EntityListConfig = {
    title: "Children List",
    addNew: "Add child",
    filterPlaceholder: "i.e. Participant name",
    columns: [
      { component: "DisplayText", title: "PN", id: "projectNumber" },
      { component: "ChildBlock", title: "Name", id: "name" },
      { component: "DisplayDate", title: "DoB", id: "dateOfBirth" },
      { component: "DisplayText", title: "Gender", id: "gender" },
      { component: "DisplayText", title: "Class", id: "schoolClass" },
      { component: "DisplayText", title: "School", id: "schoolId" },
      {
        component: "RecentAttendanceBlocks",
        title: "Attendance (School)",
        id: "school",
      },
    ],
    columnGroup: {
      default: "Basic Info",
      mobile: "School Info",
      groups: [
        {
          name: "Basic Info",
          columns: ["projectNumber", "name", "dateOfBirth"],
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
        type: "prebuilt",
        id: "school",
      },
    ],
  };
  const routeMock = {
    data: of(routeData),
    queryParams: of({}),
  };
  const mockChildrenService: jasmine.SpyObj<ChildrenService> = jasmine.createSpyObj(
    ["getChildren"]
  );
  const mockEntityMapper: jasmine.SpyObj<EntityMapperService> = jasmine.createSpyObj(
    ["loadType", "save"]
  );
  beforeEach(
    waitForAsync(() => {
      mockEntityMapper.loadType.and.resolveTo([]);
      const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
      mockChildrenService.getChildren.and.returnValue(of([]));
      TestBed.configureTestingModule({
        declarations: [ChildrenListComponent, ExportDataDirective],

        imports: [
          ChildrenModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
        ],
        providers: [
          {
            provide: ChildrenService,
            useValue: mockChildrenService,
          },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper,
          },
          {
            provide: SessionService,
            useValue: mockSessionService,
          },
          { provide: ActivatedRoute, useValue: routeMock },
          {
            provide: LoggingService,
            useValue: jasmine.createSpyObj(["warn"]),
          },
          { provide: BackupService, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenListComponent);
    component = fixture.componentInstance;
    const router = fixture.debugElement.injector.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load children on init", fakeAsync(() => {
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    mockChildrenService.getChildren.and.returnValue(of([child1, child2]));
    component.ngOnInit();
    tick();
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
    expect(component.childrenList).toEqual([child1, child2]);
  }));

  it("should route to the given id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("childId");
    expect(router.navigate).toHaveBeenCalledWith(["/child", "childId"]);
  });

  it("should create a filter with all schools sorted by names", fakeAsync(() => {
    const firstSchool = new School("a test");
    firstSchool.name = "A Test";
    const secondSchool = new School("test");
    secondSchool.name = "Test";

    mockEntityMapper.loadType.and.resolveTo([secondSchool, firstSchool]);
    component.ngOnInit();
    tick();
    const schoolFilter = component.listConfig.filters.find(
      (f) => f.id === "school"
    ) as PrebuiltFilterConfig<Child>;
    expect(schoolFilter.options.length).toBe(3);
    expect(schoolFilter.options[0].key).toBe("");
    expect(schoolFilter.options[0].label).toBe("All");
    expect(schoolFilter.options[1].key).toBe("a test");
    expect(schoolFilter.options[1].label).toBe("A Test");
    expect(schoolFilter.options[2].key).toBe("test");
    expect(schoolFilter.options[2].label).toBe("Test");
  }));
});
