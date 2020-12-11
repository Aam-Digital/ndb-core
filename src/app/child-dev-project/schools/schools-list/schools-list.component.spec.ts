import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { SchoolsListComponent } from "./schools-list.component";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "app/core/user/user";
import { of } from "rxjs";
import { SchoolsModule } from "../schools.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { School } from "../model/school";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";

describe("SchoolsListComponent", () => {
  let component: SchoolsListComponent;
  let fixture: ComponentFixture<SchoolsListComponent>;

  const routeData: EntityListConfig = {
    title: "Schools List",
    columns: [
      { component: "DisplayText", title: "Name", id: "name" },
      { component: "DisplayText", title: "Up to class", id: "upToClass" },
    ],
    columnGroup: {
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

  beforeEach(async(() => {
    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        SchoolsModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
        { provide: SessionService, useValue: mockSessionService },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the schools", fakeAsync(() => {
    const entityMapper = fixture.debugElement.injector.get(EntityMapperService);
    const school1 = new School("s1");
    const school2 = new School("s2");
    spyOn(entityMapper, "loadType").and.returnValue(
      Promise.resolve([school1, school2])
    );
    component.ngOnInit();
    tick();
    expect(entityMapper.loadType).toHaveBeenCalledWith(School);
    expect(component.schoolList).toEqual([school1, school2]);
  }));

  it("should route to id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("schoolId");
    expect(router.navigate).toHaveBeenCalledWith(["/school", "schoolId"]);
  });
});
