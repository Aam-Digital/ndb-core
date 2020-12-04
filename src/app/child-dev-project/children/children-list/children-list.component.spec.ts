import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildrenListComponent } from "./children-list.component";
import { CommonModule } from "@angular/common";
import { ChildrenService } from "../children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Database } from "../../../core/database/database";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ExportDataComponent } from "../../../core/admin/export-data/export-data.component";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "app/core/user/user";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeData = {
    title: "Children List",
    columns: [
      { type: "text", title: "PN", id: "projectNumber" },
      { type: "child-block", title: "Name", id: "name" },
      { type: "date", title: "DoB", id: "dateOfBirth" },
      { type: "text", title: "Gender", id: "gender" },
      { type: "latest-csr", title: "Class", id: "schoolClass" },
      { type: "latest-csr", title: "School", id: "schoolId" },
      { type: "list-attendance", title: "Attendance (School)", id: "school" },
    ],
    columnGroups: {
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
      },
      {
        id: "center",
      },
    ],
  };
  const routeMock = {
    data: of(routeData),
    queryParams: of({}),
  };

  beforeEach(async(() => {
    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [ChildrenListComponent, ExportDataComponent],

      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([
          { path: "child", component: ChildrenListComponent },
        ]),
      ],
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
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
  }));

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
});
