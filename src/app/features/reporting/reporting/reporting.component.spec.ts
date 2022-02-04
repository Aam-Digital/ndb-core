import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ReportingComponent } from "./reporting.component";
import { CommonModule } from "@angular/common";
import { ReportingModule } from "../reporting.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { ReportingService } from "../reporting.service";
import { MatNativeDateModule } from "@angular/material/core";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { ReportRow } from "../report-row";
import {
  ReportConfig,
  ReportingComponentConfig,
} from "./reporting-component-config";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ReportingComponent", () => {
  let component: ReportingComponent;
  let fixture: ComponentFixture<ReportingComponent>;
  const mockRouteData = new Subject<RouteData<ReportingComponentConfig>>();
  let mockReportingService: jasmine.SpyObj<ReportingService>;

  const testReport: ReportConfig = {
    title: "test report",
    aggregationDefinitions: [
      {
        query: "some query",
        label: "some label",
        groupBy: ["some", "values"],
        aggregations: [],
      },
    ],
  };

  beforeEach(async () => {
    mockReportingService = jasmine.createSpyObj(["calculateReport"]);
    mockReportingService.calculateReport.and.resolveTo([]);
    await TestBed.configureTestingModule({
      declarations: [ReportingComponent],
      imports: [
        CommonModule,
        ReportingModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
        MatNativeDateModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
        { provide: ReportingService, useValue: mockReportingService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    mockRouteData.next({ config: { reports: [] } });
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call the reporting service with the aggregation config", fakeAsync(() => {
    const aggregationConfig: ReportingComponentConfig = {
      reports: [testReport],
    };
    mockRouteData.next({ config: aggregationConfig });

    expect(component.loading).toBeFalsy();

    component.calculateResults();

    expect(component.loading).toBeTrue();
    tick();
    expect(component.loading).toBeFalse();

    expect(mockReportingService.calculateReport).toHaveBeenCalledWith(
      testReport.aggregationDefinitions,
      undefined,
      jasmine.any(Date)
    );
  }));

  it("should display the report results", fakeAsync(() => {
    component.selectedReport = testReport;
    const results: ReportRow[] = [
      {
        header: { label: "test label", groupedBy: [], result: 1 },
        subRows: [],
      },
    ];
    mockReportingService.calculateReport.and.resolveTo(results);

    component.calculateResults();

    tick();
    expect(component.results).toEqual(results);
  }));

  it("should create a table that can be exported", fakeAsync(() => {
    component.selectedReport = testReport;
    const schoolClass = defaultInteractionTypes.find(
      (it) => it.id === "SCHOOL_CLASS"
    );
    const coachingClass = defaultInteractionTypes.find(
      (it) => it.id === "COACHING_CLASS"
    );
    mockReportingService.calculateReport.and.resolveTo([
      {
        header: { label: "Total # of events", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of events",
              groupedBy: [{ property: "category", value: coachingClass }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of events",
              groupedBy: [{ property: "category", value: schoolClass }],
              result: 2,
            },
            subRows: [],
          },
        ],
      },
      {
        header: { label: "Total # of schools", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of schools",
              groupedBy: [{ property: "language", value: "" }],
              result: 2,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of schools",
              groupedBy: [{ property: "language", value: "Hindi" }],
              result: 1,
            },
            subRows: [],
          },
        ],
      },
      {
        header: { label: "Total # of schools", groupedBy: [], result: 2 },
        subRows: [
          {
            header: {
              label: "Total # of schools",
              groupedBy: [{ property: "privateSchool", value: true }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of schools",
              groupedBy: [{ property: "privateSchool", value: false }],
              result: 1,
            },
            subRows: [],
          },
        ],
      },
    ]);

    component.calculateResults();
    tick();

    expect(component.exportableTable).toEqual([
      { label: "Total # of events", result: 3 },
      { label: `Total # of events (${coachingClass.label})`, result: 1 },
      { label: `Total # of events (${schoolClass.label})`, result: 2 },
      { label: "Total # of schools", result: 3 },
      { label: `Total # of schools (without language)`, result: 2 },
      { label: `Total # of schools (Hindi)`, result: 1 },
      { label: "Total # of schools", result: 2 },
      { label: `Total # of schools (privateSchool)`, result: 1 },
      { label: `Total # of schools (not privateSchool)`, result: 1 },
    ]);
  }));
});
