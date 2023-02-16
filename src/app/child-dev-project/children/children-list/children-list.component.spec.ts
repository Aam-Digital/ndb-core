import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ChildrenListComponent } from "./children-list.component";
import { ChildrenService } from "../children.service";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Child } from "../model/child";
import {
  BooleanFilterConfig,
  EntityListConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { School } from "../../schools/model/school";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { DownloadService } from "../../../core/export/download-service/download.service";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeData: EntityListConfig = {
    title: "Children List",
    filterPlaceholder: "e.g. participant name",
    columns: [
      { view: "DisplayText", label: "PN", id: "projectNumber" },
      { view: "ChildBlock", label: "Name", id: "name" },
      { view: "DisplayDate", label: "DoB", id: "dateOfBirth" },
      { view: "DisplayText", label: "Gender", id: "gender" },
      { view: "DisplayText", label: "Class", id: "schoolClass" },
      { view: "DisplayText", label: "School", id: "schoolId" },
      {
        view: "RecentAttendanceBlocks",
        label: "Attendance (School)",
        id: "school",
      },
    ],
    columnGroups: {
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
    data: of({ config: routeData }),
    queryParams: of({}),
    snapshot: {
      queryParamMap: {
        get: () => "",
      },
      queryParams: {},
    },
  };
  const mockChildrenService: jasmine.SpyObj<ChildrenService> =
    jasmine.createSpyObj(["getChildren"]);

  beforeEach(waitForAsync(() => {
    mockChildrenService.getChildren.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [ChildrenListComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ChildrenService,
          useValue: mockChildrenService,
        },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: DownloadService, useValue: {} },
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

  it("should load children on init", () => {
    component.isLoading = true;
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    mockChildrenService.getChildren.and.returnValue(of([child1, child2]));
    component.ngOnInit();

    let children = [];
    component.childrenList.subscribe((val) => (children = val));
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
    expect(children).toEqual([child1, child2]);
    expect(component.isLoading).toBeFalse();
  });

  it("should route to the given id", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.routeTo("childId");
    expect(router.navigate).toHaveBeenCalledWith(["/child", "childId"]);
  });
});
