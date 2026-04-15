import { ComponentFixture, TestBed } from "@angular/core/testing";

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
import { mockEntityMapperProvider } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { ReportEntity, SqlReport } from "../report-config";
import {
  ReportCalculation,
  ReportData,
  SqlReportService,
} from "../sql-report/sql-report.service";
import { of } from "rxjs";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { JsonEditorService } from "#src/app/core/admin/json-editor/json-editor.service";
import { Angulartics2Module } from "angulartics2";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import type { Mock } from "vitest";

type ReportingServiceMock = {
  calculateReport: Mock;
};

type DataTransformationServiceMock = {
  queryAndTransformData: Mock;
};

type SqlReportServiceMock = {
  query: Mock;
  getCsvforV2: Mock;
  flattenData: Mock;
  fetchReportCalculation: Mock;
  createReportCalculation: Mock;
  waitForReportData: Mock;
  fetchReportCalculationData: Mock;
};

describe("ReportingComponent", () => {
  let component: ReportingComponent;
  let fixture: ComponentFixture<ReportingComponent>;
  let mockReportingService: ReportingServiceMock;
  let mockDataTransformationService: DataTransformationServiceMock;
  let mockSqlReportService: SqlReportServiceMock;

  const testReport = new ReportEntity();

  let validReportCalculation: ReportCalculation = {
    id: "report-calculation-2",
    report: {
      id: "report-id",
    },
    status: "FINISHED_SUCCESS",
    startDate: "2024-06-07T09:26:56.414",
    endDate: "2024-06-09T09:26:57.431",
    args: { from: "2024-01-01T00:00:00.000", to: "2024-01-01T23:59:59.999" },
    outcome: {
      result_hash: "000",
    },
  };

  let validReportDataResponse: ReportData = {
    id: "id",
    report: {
      id: "report-id",
    },
    calculation: {
      id: "calculation-id",
    },
    data: [
      {
        foo: "bar",
      },
    ],
  };

  beforeEach(async () => {
    mockReportingService = {
      calculateReport: vi.fn(),
    };
    mockDataTransformationService = {
      queryAndTransformData: vi.fn(),
    };
    mockReportingService.calculateReport.mockResolvedValue([]);
    mockSqlReportService = {
      query: vi.fn(),
      getCsvforV2: vi.fn(),
      flattenData: vi.fn(),
      fetchReportCalculation: vi.fn(),
      createReportCalculation: vi.fn(),
      waitForReportData: vi.fn(),
      fetchReportCalculationData: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [
        ReportingComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
        MatNativeDateModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
      ],
      providers: [
        { provide: DataAggregationService, useValue: mockReportingService },
        {
          provide: DataTransformationService,
          useValue: mockDataTransformationService,
        },
        { provide: SqlReportService, useValue: mockSqlReportService },
        ...mockEntityMapperProvider(),
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
        {
          provide: JsonEditorService,
          useValue: {
            openJsonEditorDialog: vi.fn(),
          },
        },
        {
          provide: EntityAbility,
          useValue: {
            cannot: vi.fn().mockReturnValue(false),
            on: vi.fn().mockReturnValue(() => undefined),
          },
        },
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

  it("should call the reporting service with the aggregation config", async () => {
    vi.useFakeTimers();
    try {
      expect(component.isLoading).toBeFalsy();

      component.calculateResults(testReport, new Date(), new Date());

      expect(component.isLoading).toBe(true);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.isLoading).toBe(false);

      expect(mockReportingService.calculateReport).toHaveBeenCalledWith(
        testReport.aggregationDefinitions as Aggregation[],
        expect.any(Date),
        expect.any(Date),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should display the report results", async () => {
    vi.useFakeTimers();
    try {
      const results: ReportRow[] = [
        {
          header: { label: "test label", groupedBy: [], result: 1 },
          subRows: [],
        },
      ];
      mockReportingService.calculateReport.mockResolvedValue(results);

      component.calculateResults(testReport, new Date(), new Date());

      await vi.advanceTimersByTimeAsync(0);
      expect(component.data).toEqual(results);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create a table that can be exported", async () => {
    vi.useFakeTimers();
    try {
      const schoolClass = defaultInteractionTypes.find(
        (it) => it.id === "SCHOOL_CLASS",
      );
      const coachingClass = defaultInteractionTypes.find(
        (it) => it.id === "COACHING_CLASS",
      );
      mockReportingService.calculateReport.mockResolvedValue([
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
      await vi.advanceTimersByTimeAsync(0);

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
    } finally {
      vi.useRealTimers();
    }
  });

  it("should use the export service when report has mode 'exporting'", async () => {
    const data = [
      { First: 1, Second: 2 },
      { First: 3, Second: 4 },
    ];
    mockDataTransformationService.queryAndTransformData.mockResolvedValue(data);
    const report = new ReportEntity();
    report.mode = "exporting";
    report.aggregationDefinitions = [];

    await component.calculateResults(report, new Date(), new Date());

    expect(
      mockDataTransformationService.queryAndTransformData,
    ).toHaveBeenCalledWith([], expect.any(Date), expect.any(Date));
    expect(component.data).toEqual(data);
    expect(component.mode).toBe("exporting");
  });

  it("should use the sql report service when report has mode 'sql'", async () => {
    // Given
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    mockSqlReportService.query.mockReturnValue(
      Promise.resolve(validReportDataResponse),
    );

    mockSqlReportService.fetchReportCalculation.mockReturnValue(
      of(validReportCalculation),
    );

    // When
    await component.calculateResults(
      report,
      new Date("2023-01-01"),
      new Date("2023-01-01"),
    );

    // Then
    expect(mockSqlReportService.query).toHaveBeenCalledWith(
      report,
      new Date("2023-01-01"),
      new Date("2023-01-01"),
      false,
    );
  });

  it("should re-trigger the report calculation on second calculate click", async () => {
    // Given
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    component.reportCalculation = validReportCalculation;

    mockSqlReportService.query.mockReturnValue(
      Promise.resolve(validReportDataResponse),
    );

    mockSqlReportService.fetchReportCalculation.mockReturnValue(
      of(validReportCalculation),
    );

    // When
    await component.calculateResults(
      report,
      new Date("2023-01-01"),
      new Date("2023-01-01"),
    );

    // Then
    expect(mockSqlReportService.query).toHaveBeenCalledWith(
      report,
      new Date("2023-01-01"),
      new Date("2023-01-01"),
      true,
    );
  });

  it("should show error when getReportResults returns an error", async () => {
    // Given
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    mockSqlReportService.query.mockReturnValue(Promise.reject(Error("foo")));

    // When
    await component.calculateResults(
      report,
      new Date("2023-01-01"),
      new Date("2023-01-01"),
    );

    // Then
    expect(component.isError).toBe(true);
    expect(component.errorDetails).not.toBeNull();
    expect(component.data).toEqual([]);
  });

  it("should return raw data for version 1 SQL reports", () => {
    const mockData = [
      { child_gender: "M", child_name: "child1" },
      { child_gender: "X", child_name: "child2" },
    ];

    component.data = mockData;
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";
    component.currentReport = report;

    const result = component["getSqlExportableData"]();

    expect(result).toEqual(mockData);
  });
});
