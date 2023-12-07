import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ReportingComponent } from "./reporting.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  Aggregation,
  DataAggregationService,
} from "../data-aggregation.service";
import { MatNativeDateModule } from "@angular/material/core";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { ReportRow } from "../report-row";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { DataTransformationService } from "../../../core/export/data-transformation-service/data-transformation.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { ReportConfig, SqlReport } from "../report-config";
import { SqlReportService } from "../sql-report/sql-report.service";

describe("ReportingComponent", () => {
  let component: ReportingComponent;
  let fixture: ComponentFixture<ReportingComponent>;
  let mockReportingService: jasmine.SpyObj<DataAggregationService>;
  let mockDataTransformationService: jasmine.SpyObj<DataTransformationService>;
  let mockSqlReportService: jasmine.SpyObj<SqlReportService>;

  const testReport = ReportConfig.create({
    title: "test report",
    aggregationDefinitions: [
      {
        query: "some query",
        label: "some label",
        groupBy: ["some", "values"],
        aggregations: [],
      },
    ],
  });

  beforeEach(async () => {
    mockReportingService = jasmine.createSpyObj(["calculateReport"]);
    mockDataTransformationService = jasmine.createSpyObj([
      "queryAndTransformData",
    ]);
    mockReportingService.calculateReport.and.resolveTo([]);
    mockSqlReportService = jasmine.createSpyObj(["query"]);
    await TestBed.configureTestingModule({
      imports: [
        ReportingComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
        MatNativeDateModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: DataAggregationService, useValue: mockReportingService },
        {
          provide: DataTransformationService,
          useValue: mockDataTransformationService,
        },
        { provide: SqlReportService, useValue: mockSqlReportService },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call the reporting service with the aggregation config", fakeAsync(() => {
    expect(component.loading).toBeFalsy();

    component.calculateResults(testReport, new Date(), new Date());

    expect(component.loading).toBeTrue();
    tick();
    expect(component.loading).toBeFalse();

    expect(mockReportingService.calculateReport).toHaveBeenCalledWith(
      testReport.aggregationDefinitions as Aggregation[],
      jasmine.any(Date),
      jasmine.any(Date),
    );
  }));

  it("should display the report results", fakeAsync(() => {
    const results: ReportRow[] = [
      {
        header: { label: "test label", groupedBy: [], result: 1 },
        subRows: [],
      },
    ];
    mockReportingService.calculateReport.and.resolveTo(results);

    component.calculateResults(testReport, new Date(), new Date());

    tick();
    expect(component.data).toEqual(results);
  }));

  it("should create a table that can be exported", fakeAsync(() => {
    const schoolClass = defaultInteractionTypes.find(
      (it) => it.id === "SCHOOL_CLASS",
    );
    const coachingClass = defaultInteractionTypes.find(
      (it) => it.id === "COACHING_CLASS",
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

    component.calculateResults(testReport, new Date(), new Date());
    tick();

    expect(component.exportableData).toEqual([
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

  it("should use the export service when aggregation has mode 'exporting'", async () => {
    const data = [
      { First: 1, Second: 2 },
      { First: 3, Second: 4 },
    ];
    mockDataTransformationService.queryAndTransformData.and.resolveTo(data);

    await component.calculateResults(
      ReportConfig.create({ mode: "exporting", aggregationDefinitions: [] }),
      new Date(),
      new Date(),
    );

    expect(
      mockDataTransformationService.queryAndTransformData,
    ).toHaveBeenCalledWith([], jasmine.any(Date), jasmine.any(Date));
    expect(component.data).toEqual(data);
    expect(component.mode).toBe("exporting");
  });

  it("should use the sql report service when aggregation has mode 'sql'", async () => {
    const report = new SqlReport();
    report.mode = "sql";

    await component.calculateResults(
      report,
      new Date("2023-01-01"),
      new Date("2023-12-31"),
    );

    expect(mockSqlReportService.query).toHaveBeenCalledWith(
      report,
      new Date("2023-01-01"),
      // Next day (to date is exclusive
      new Date("2024-01-01"),
    );
  });
});
