import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { SchoolsListComponent } from "./schools-list.component";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { SchoolsModule } from "../schools.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { School } from "../model/school";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { ExportService } from "../../../core/export/export-service/export.service";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

describe("SchoolsListComponent", () => {
  let component: SchoolsListComponent;
  let fixture: ComponentFixture<SchoolsListComponent>;

  const routeData: EntityListConfig = {
    title: "Schools List",
    columns: [],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "School Info",
          columns: ["name", "lanuage", "address"],
        },
      ],
    },
    filters: [
      {
        id: "language",
      },
    ],
  };

  const routeMock = {
    data: of({ config: routeData }),
    queryParams: of({}),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [
          SchoolsModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [
          { provide: ActivatedRoute, useValue: routeMock },
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
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo([school1, school2]);

    component.ngOnInit();
    tick();

    expect(loadTypeSpy).toHaveBeenCalledWith(School);
    expect(component.schoolList).toEqual([school1, school2]);
  }));

  it("should route to id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("schoolId");
    expect(router.navigate).toHaveBeenCalledWith(["/school", "schoolId"]);
  });
});
