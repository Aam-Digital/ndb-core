import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { ChildrenListComponent } from "./children-list.component";
import { ChildrenService } from "../children.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Database } from "../../../core/database/database";
import { RouterTestingModule } from "@angular/router/testing";
import { ExportDataComponent } from "../../../core/admin/export-data/export-data.component";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { ChildrenModule } from "../children.module";
import { Angulartics2Module } from "angulartics2";
import { Child } from "../model/child";
import {
  BooleanFilterConfig,
  EntityListConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { User } from "../../../core/user/user";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeData: EntityListConfig = {
    title: "Children List",
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
    ],
  };
  const routeMock = {
    data: of(routeData),
    queryParams: of({}),
  };

  beforeEach(
    waitForAsync(() => {
      const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
      TestBed.configureTestingModule({
        declarations: [ChildrenListComponent, ExportDataComponent],

        imports: [
          ChildrenModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
        ],
        providers: [
          {
            provide: SessionService,
            useValue: mockSessionService,
          },
          { provide: Database, useClass: MockDatabase },
          {
            provide: ChildPhotoService,
            useValue: jasmine.createSpyObj(["getImage"]),
          },
          { provide: ActivatedRoute, useValue: routeMock },
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
    const childrenService = fixture.debugElement.injector.get(ChildrenService);
    spyOn(childrenService, "getChildren").and.returnValue(of([child1, child2]));
    component.ngOnInit();
    tick();
    expect(childrenService.getChildren).toHaveBeenCalled();
    expect(component.childrenList).toEqual([child1, child2]);
  }));

  it("should route to the given id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("childId");
    expect(router.navigate).toHaveBeenCalledWith(["/child", "childId"]);
  });
});
