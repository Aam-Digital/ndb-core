import { TestBed } from "@angular/core/testing";

import {
  ReportCalculation,
  ReportData,
  SqlReportService,
} from "./sql-report.service";
import { entityRegistry } from "../../../core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { ReportEntity, SqlReport } from "../report-config";
import moment from "moment";

describe("SqlReportService", () => {
  let service: SqlReportService;

  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  let validReportCalculationsResponse: ReportCalculation[] = [
    {
      id: "report-calculation-1",
      report: {
        id: "report-id",
      },
      startDate: null,
      endDate: null,
      status: "PENDING",
      args: {},
      outcome: {
        result_hash:
          "180a94a09c517b24e994aaf8342c58270a775f953eb32af78f06f1c8f61e37b9",
      },
    },
    {
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
    },
    {
      id: "report-calculation-3",
      report: {
        id: "report-id",
      },
      status: "FINISHED_SUCCESS",
      startDate: "2024-06-07T09:26:56.414",
      endDate: "2024-06-07T09:26:57.431",
      args: { from: "2024-01-01T00:00:00.000", to: "2024-01-01T23:59:59.999" },
      outcome: {
        result_hash: "000",
      },
    },
  ];

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

  beforeEach(() => {
    entityRegistry.allowDuplicates();
    mockHttpClient = jasmine.createSpyObj(["post", "get"]);

    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });
    service = TestBed.inject(SqlReportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a new report calculation if no one exist", async () => {
    // Given
    mockHttpClient.get.and.returnValues(
      of(validReportCalculationsResponse),
      of(validReportCalculationsResponse[1]),
      of(validReportDataResponse),
    );
    mockHttpClient.post.and.returnValue(
      of({
        id: "calculation-id",
      }),
    );

    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    // When
    const result = await service.query(
      report,
      moment("2024-01-02T00:00:00.000").toDate(),
      moment("2024-01-02T23:59:59.999").toDate(),
    );

    // Then
    expect(mockHttpClient.post).toHaveBeenCalledOnceWith(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${report.getId()}`,
      {},
      {
        params: {
          from: "2024-01-02",
          to: "2024-01-02",
        },
      },
    );
    expect(result).toEqual(validReportDataResponse);
  });

  it("should create a new report calculation if forceCalculation is true", async () => {
    // Given
    mockHttpClient.get.and.returnValues(
      of(validReportCalculationsResponse[1]),
      of(validReportDataResponse),
    );
    mockHttpClient.post.and.returnValue(
      of({
        id: "calculation-id",
      }),
    );

    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    // When
    const result = await service.query(
      report,
      moment("2024-01-02T00:00:00.000").toDate(),
      moment("2024-01-02T23:59:59.999").toDate(),
      true,
    );

    // Then
    expect(mockHttpClient.post).toHaveBeenCalledOnceWith(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${report.getId()}`,
      {},
      {
        params: {
          from: "2024-01-02",
          to: "2024-01-02",
        },
      },
    );
    expect(result).toEqual(validReportDataResponse);
  });

  it("should fetch the existing report calculation data if data exist", async () => {
    // Given
    mockHttpClient.get.and.returnValues(
      of(validReportCalculationsResponse),
      of(validReportDataResponse),
    );
    mockHttpClient.post.and.returnValue(
      of({
        id: "calculation-id",
      }),
    );

    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    // When
    const result = await service.query(
      report,
      moment("2024-01-01").toDate(),
      moment("2024-01-01").toDate(),
    );

    // Then
    expect(mockHttpClient.post).not.toHaveBeenCalled();
    expect(result).toEqual(validReportDataResponse);
  });
});
