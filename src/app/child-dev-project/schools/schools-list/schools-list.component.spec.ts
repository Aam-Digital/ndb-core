import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { SchoolsListComponent } from "./schools-list.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionService } from "../../../core/session/session-service/session.service";
import { of } from "rxjs";
import { SchoolsModule } from "../schools.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { School } from "../model/school";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { User } from "../../../core/user/user";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../core/entity/mock-entity-mapper-service";
import { ExportService } from "../../../core/export/export-service/export.service";

describe("SchoolsListComponent", () => {
  let component: SchoolsListComponent;
  let fixture: ComponentFixture<SchoolsListComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  const routeData: EntityListConfig = {
    title: "Schools List",
    columns: [],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "School Info",
          columns: ["name", "upToClass"],
        },
      ],
    },
    filters: [
      {
        id: "upToClass",
      },
    ],
  };

  const routeMock = {
    data: of(routeData),
    queryParams: of({}),
  };
  let mockedEntityMapper: MockEntityMapperService;

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });
      mockedEntityMapper = mockEntityMapper([new User("TestUser")]);
      TestBed.configureTestingModule({
        declarations: [],
        imports: [
          SchoolsModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
          NoopAnimationsModule,
        ],
        providers: [
          { provide: ActivatedRoute, useValue: routeMock },
          { provide: SessionService, useValue: mockSessionService },
          { provide: EntityMapperService, useValue: mockedEntityMapper },
          { provide: ExportService, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the schools", fakeAsync(() => {
    const school1 = new School("s1");
    const school2 = new School("s2");
    spyOn(mockedEntityMapper, "loadType").and.resolveTo([school1, school2]);
    component.ngOnInit();
    tick();
    expect(mockedEntityMapper.loadType).toHaveBeenCalledWith(School);
    expect(component.schoolList).toEqual([school1, school2]);
  }));

  it("should route to id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("schoolId");
    expect(router.navigate).toHaveBeenCalledWith(["/school", "schoolId"]);
  });
});
