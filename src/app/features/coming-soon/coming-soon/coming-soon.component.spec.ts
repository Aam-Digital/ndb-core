import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ComingSoonComponent } from "./coming-soon.component";
import { BehaviorSubject } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { AnalyticsService } from "../../../core/analytics/analytics.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ComingSoonComponent", () => {
  let component: ComingSoonComponent;
  let fixture: ComponentFixture<ComingSoonComponent>;

  const testFeatureId = "test-feature";
  let mockAnalytics;
  let mockActivatedRoute;

  beforeEach(waitForAsync(() => {
    mockAnalytics = jasmine.createSpyObj("mockAnalytics", ["eventTrack"]);
    mockActivatedRoute = {
      paramMap: new BehaviorSubject(
        convertToParamMap({
          feature: testFeatureId,
        }),
      ),
    };

    TestBed.configureTestingModule({
      imports: [ComingSoonComponent, FontAwesomeTestingModule],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: AlertService, useValue: { addInfo: () => {} } },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComingSoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and report", () => {
    component.featureId = testFeatureId;

    mockActivatedRoute.paramMap.next(
      convertToParamMap({
        feature: testFeatureId,
      }),
    );

    expect(component).toBeTruthy();
    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(testFeatureId, {
      category: "feature_request",
      label: "visit",
    });
  });

  it("should report on click and lock button", () => {
    component.featureId = testFeatureId;

    component.reportFeatureRequest();

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(testFeatureId, {
      category: "feature_request",
      label: "request",
    });
    expect(component.requested).toBeTrue();
  });

  it("should remember previously requested feature", () => {
    component.reportFeatureRequest();

    const fixture2 = TestBed.createComponent(ComingSoonComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.requested).toBeTrue();
  });
});
