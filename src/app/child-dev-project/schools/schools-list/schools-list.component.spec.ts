import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { SchoolsListComponent } from "./schools-list.component";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { SchoolsModule } from "../schools.module";
import { School } from "../model/school";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { ExportService } from "../../../core/export/export-service/export.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

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
          columns: ["name"],
        },
      ],
    },
  };

  const routeMock = {
    data: of({ config: routeData }),
    queryParams: of({}),
    snapshot: { queryParams: {} },
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SchoolsModule,
          MockedTestingModule.withState(),
          FontAwesomeTestingModule,
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

  it("should indicate once loading is finished", fakeAsync(() => {
    expect(component.isLoading).toBeTrue();
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    const subject = new Subject<School[]>();
    loadTypeSpy.and.returnValue(subject.toPromise());
    component.ngOnInit();
    tick();
    expect(component.isLoading).toBeTrue();
    subject.complete();
    tick();
    expect(component.isLoading).toBeFalse();
  }));
});
