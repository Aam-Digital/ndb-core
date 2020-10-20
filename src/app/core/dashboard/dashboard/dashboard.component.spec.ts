import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { ProgressDashboardComponent } from "../../../child-dev-project/progress-dashboard-widget/progress-dashboard/progress-dashboard.component";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let mockRouteData: BehaviorSubject<any>;

  beforeEach(() => {
    mockRouteData = new BehaviorSubject({ widgets: [] });

    TestBed.configureTestingModule({
      declarations: [DashboardComponent, ProgressDashboardComponent],
      imports: [],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init with widget config from activated route", () => {
    const testDashboardConfig = {
      widgets: [
        {
          component: "ProgressDashboard",
        },
        {
          component: "ProgressDashboard",
        },
      ],
    };

    mockRouteData.next(testDashboardConfig);

    expect(component.widgets).toEqual(testDashboardConfig.widgets);
  });
});
