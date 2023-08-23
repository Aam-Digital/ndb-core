import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { RouteData } from "../../config/dynamic-routing/view-config.interface";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let mockRouteData: BehaviorSubject<
    RouteData<{ widgets: DynamicComponentConfig[] }>
  >;

  beforeEach(() => {
    mockRouteData = new BehaviorSubject({ config: { widgets: [] } });

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
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

    mockRouteData.next({ config: testDashboardConfig });

    expect(component.widgets).toEqual(testDashboardConfig.widgets);
  });
});
