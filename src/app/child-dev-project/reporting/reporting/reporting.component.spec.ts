import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import {
  ReportingComponent,
  ReportingComponentConfig,
} from "./reporting.component";
import { CommonModule } from "@angular/common";
import { ReportingModule } from "../reporting.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { Aggregation, ReportingService, ReportRow } from "../reporting.service";
import { MatNativeDateModule } from "@angular/material/core";

describe("ReportingComponent", () => {
  let component: ReportingComponent;
  let fixture: ComponentFixture<ReportingComponent>;
  const mockRouteData = new Subject();
  let mockReportingService: jasmine.SpyObj<ReportingService>;

  beforeEach(async () => {
    mockReportingService = jasmine.createSpyObj([
      "setAggregations",
      "calculateReport",
    ]);
    await TestBed.configureTestingModule({
      declarations: [ReportingComponent],
      imports: [
        CommonModule,
        ReportingModule,
        NoopAnimationsModule,
        MatNativeDateModule,
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
    mockRouteData.next({ aggregationDefinitions: {} });
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call the reporting service with the aggregation config", () => {
    const aggregationConfig: ReportingComponentConfig = {
      aggregationDefinitions: [
        {
          query: "some query",
          label: "some label",
          groupBy: ["some", "values"],
          aggregations: [],
        },
      ],
    };
    mockRouteData.next(aggregationConfig);

    component.calculateResults();

    expect(mockReportingService.setAggregations).toHaveBeenCalledWith(
      aggregationConfig.aggregationDefinitions
    );
  });

  it("should display the report results", fakeAsync(() => {
    const results: ReportRow[] = [
      { header: { label: "test label", result: 1 }, subRows: [] },
    ];
    mockReportingService.calculateReport.and.resolveTo(results);

    component.calculateResults();

    tick();
    expect(component.results).toEqual(results);
  }));

  it("should create a table that can be exported", () => {
    mockReportingService.calculateReport.and.resolveTo([
      {
        header: { label: "top level", result: 1 },
        subRows: [
          {
            header: { label: "first nested", values: ["one value"], result: 2 },
            subRows: [
              {
                header: {
                  label: "double nested",
                  values: ["two", "values"],
                  result: 2.5,
                },
                subRows: [],
              },
            ],
          },
          {
            header: { label: "second nested", values: [], result: 3 },
            subRows: [],
          },
        ],
      },
    ]);

    component.calculateResults();

    expect(component.reportTable).toEqual([
      { label: "top level", result: 1 },
      { label: "first nested (one value)", result: 2 },
      { label: "double nested (two, values)", result: 2.5 },
      { label: "second nested", result: 3 },
    ]);
  });
});
