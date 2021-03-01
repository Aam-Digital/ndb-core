import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ComingSoonComponent } from "./coming-soon.component";
import { Angulartics2 } from "angulartics2";
import { BehaviorSubject, Subject } from "rxjs";
import { AlertService } from "../../alerts/alert.service";
import { ActivatedRoute, convertToParamMap } from "@angular/router";

describe("ComingSoonComponent", () => {
  let component: ComingSoonComponent;
  let fixture: ComponentFixture<ComingSoonComponent>;

  const testFeatureId = "test-feature";
  let mockAngulartics;
  let mockActivatedRoute;

  beforeEach(async(() => {
    mockAngulartics = { eventTrack: new Subject() };
    mockActivatedRoute = {
      paramMap: new BehaviorSubject(
        convertToParamMap({
          feature: testFeatureId,
        })
      ),
    };

    TestBed.configureTestingModule({
      declarations: [ComingSoonComponent],
      providers: [
        { provide: Angulartics2, useValue: mockAngulartics },
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
    spyOn(mockAngulartics.eventTrack, "next");

    mockActivatedRoute.paramMap.next(
      convertToParamMap({
        feature: testFeatureId,
      })
    );

    expect(component).toBeTruthy();
    expect(mockAngulartics.eventTrack.next).toHaveBeenCalledWith({
      action: "visit",
      properties: {
        category: "feature_request",
        label: testFeatureId,
      },
    });
  });

  it("should report on click and lock button", () => {
    component.featureId = testFeatureId;
    spyOn(mockAngulartics.eventTrack, "next");

    component.reportFeatureRequest();

    expect(mockAngulartics.eventTrack.next).toHaveBeenCalledWith({
      action: "request",
      properties: {
        category: "feature_request",
        label: testFeatureId,
      },
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
