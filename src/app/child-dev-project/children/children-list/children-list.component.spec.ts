import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ChildrenListComponent } from "./children-list.component";
import { ChildrenService } from "../children.service";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Child } from "../model/child";
import {
  BooleanFilterConfig,
  EntityListConfig,
} from "../../../core/entity-list/EntityListConfig";
import { School } from "../../schools/model/school";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { DownloadService } from "../../../core/export/download-service/download.service";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeData: EntityListConfig = {
    title: "Children List",
    columns: [
      { viewComponent: "DisplayText", label: "PN", id: "projectNumber" },
      { viewComponent: "ChildBlock", label: "Name", id: "name" },
      { viewComponent: "DisplayDate", label: "DoB", id: "dateOfBirth" },
      { viewComponent: "DisplayText", label: "Gender", id: "gender" },
      { viewComponent: "DisplayText", label: "Class", id: "schoolClass" },
      { viewComponent: "DisplayText", label: "School", id: "schoolId" },
      {
        viewComponent: "RecentAttendanceBlocks",
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
    mockChildrenService.getChildren.and.resolveTo([]);
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

  it("should load children on init", async () => {
    component.isLoading = true;
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    mockChildrenService.getChildren.and.resolveTo([child1, child2]);
    await component.ngOnInit();

    expect(mockChildrenService.getChildren).toHaveBeenCalled();
    expect(component.childrenList).toEqual([child1, child2]);
    expect(component.isLoading).toBeFalse();
  });
});
