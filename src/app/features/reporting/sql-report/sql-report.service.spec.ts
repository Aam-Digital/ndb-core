import { TestBed } from "@angular/core/testing";

import {
  ReportCalculation,
  ReportCalculationError,
  ReportData,
  SqlReportRow,
  SqlReportService,
} from "./sql-report.service";
import { entityRegistry } from "../../../core/entity/database-entity.decorator";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { ReportEntity, SqlReport } from "../report-config";
import moment from "moment";

describe("SqlReportService", () => {
  let service: SqlReportService;

  let mockHttpClient: any;

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
      args: {
        startDate: "2024-01-01T00:00:00.000",
        endDate: "2024-01-01T23:59:59.999",
      },
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
      args: {
        startDate: "2024-01-01T00:00:00.000",
        endDate: "2024-01-01T23:59:59.999",
      },
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
    mockHttpClient = {
      post: vi.fn(),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });
    service = TestBed.inject(SqlReportService);
  });

  it("should create a new report calculation if no one exist", async () => {
    // Given
    mockHttpClient.get
      .mockReturnValueOnce(of(validReportCalculationsResponse))
      .mockReturnValueOnce(of(validReportCalculationsResponse[1]))
      .mockReturnValueOnce(of(validReportDataResponse));
    mockHttpClient.post.mockReturnValue(
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
    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);

    // Then
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${SqlReportService.API_URL}/report-calculation/report/${report.getId()}`,
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
    mockHttpClient.get
      .mockReturnValueOnce(of(validReportCalculationsResponse[1]))
      .mockReturnValueOnce(of(validReportDataResponse));
    mockHttpClient.post.mockReturnValue(
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
    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);

    // Then
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${SqlReportService.API_URL}/report-calculation/report/${report.getId()}`,
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
    mockHttpClient.get
      .mockReturnValueOnce(of(validReportCalculationsResponse))
      .mockReturnValueOnce(of(validReportDataResponse));
    mockHttpClient.post.mockReturnValue(
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

  describe("when no usable cached calculation exists", () => {
    const from = moment("2024-01-01").toDate();
    const to = moment("2024-01-01").toDate();
    const cachedCalculation = (
      status: ReportCalculation["status"],
    ): ReportCalculation => ({
      ...validReportCalculationsResponse[2],
      status,
    });
    const requestFailure = () =>
      throwError(() => new HttpErrorResponse({ status: 500 }));

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** run `query` while letting the calculation polling run to its end */
    async function runQuery(): Promise<ReportData> {
      const result = service.query(new ReportEntity() as SqlReport, from, to);
      result.catch(() => {}); // rejections are asserted by the caller
      await vi.advanceTimersByTimeAsync(5000);
      return result;
    }

    it.each<[string, () => Observable<unknown>[]]>([
      ["the lookup of cached calculations fails", () => [requestFailure()]],
      [
        "the cached calculations did not finish successfully",
        () => [
          of([
            cachedCalculation("FINISHED_ERROR"),
            cachedCalculation("PENDING"),
          ]),
        ],
      ],
      [
        "the cached calculation's data cannot be loaded",
        () => [of([cachedCalculation("FINISHED_SUCCESS")]), requestFailure()],
      ],
    ])("calculates anew once when %s", async (_, cacheLookupResponses) => {
      for (const response of cacheLookupResponses()) {
        mockHttpClient.get.mockReturnValueOnce(response);
      }
      mockHttpClient.get
        .mockReturnValueOnce(of(cachedCalculation("FINISHED_SUCCESS")))
        .mockReturnValueOnce(of(validReportDataResponse));
      mockHttpClient.post.mockReturnValue(of({ id: "calculation-id" }));

      await expect(runQuery()).resolves.toEqual(validReportDataResponse);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });

    it("does not start a second calculation when the backend rejects the calculation", async () => {
      const rejection = new HttpErrorResponse({
        status: 400,
        error: { errorMessage: "Invalid ReportConfig" },
      });
      mockHttpClient.get.mockReturnValueOnce(of([]));
      mockHttpClient.post.mockReturnValue(throwError(() => rejection));

      await expect(runQuery()).rejects.toBe(rejection);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });

    it("does not start a second calculation when the calculation finishes with an error", async () => {
      mockHttpClient.get
        .mockReturnValueOnce(of([]))
        .mockReturnValue(of(cachedCalculation("FINISHED_ERROR")));
      mockHttpClient.post.mockReturnValue(of({ id: "calculation-id" }));

      await expect(runQuery()).rejects.toBeInstanceOf(ReportCalculationError);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });
  });

  it("should convert data into SqlReportRow[]", async () => {
    // Given
    let data = [
      [
        {
          "New students": 6,
        },
      ],
      {
        "Students gender": [
          [
            {
              "Male students": 6,
            },
          ],
          [
            {
              "Female students": 4,
            },
          ],
        ],
      },
      [
        {
          count: 3,
          project: "FOO",
          school: "SchoolA",
        },
        {
          anzahl: 1,
          project: "BAR",
          school: "SchoolB",
        },
      ],
    ];

    // When
    const result = service.flattenData(data);

    // Then
    expect(result).toEqual([
      {
        key: "New students",
        value: 6,
        level: 0,
      },
      {
        key: "Students gender",
        value: 10,
        level: 0,
      },
      {
        key: "Male students",
        value: 6,
        level: 1,
      },
      {
        key: "Female students",
        value: 4,
        level: 1,
      },
      {
        key: "project: FOO, school: SchoolA",
        value: 3,
        level: 0,
      },
      {
        key: "project: BAR, school: SchoolB",
        value: 1,
        level: 0,
      },
    ]);
  });

  it("should convert report into CSV string for version 2 SQL", () => {
    const mockSqlData: SqlReportRow[] = [
      {
        key: "Total students",
        value: 6,
        level: 0,
      },
      {
        key: "Students gender",
        value: 10,
        level: 0,
      },
      {
        key: "Male",
        value: 6,
        level: 1,
      },
      {
        key: "Female",
        value: 4,
        level: 1,
      },
    ];

    const result = service.getCsvforV2(mockSqlData);

    // extra empty column to allow for indentation of name at child levels
    const expectedCsv = `Name,,Value
"Total students",,"6"
"Students gender",,"10"
,"Male","6"
,"Female","4"
`;
    expect(result).toEqual(expectedCsv);
  });

  it("should convert double-nested data into SqlReportRow[]", async () => {
    // Given
    let data = [
      {
        "total reached": [
          {
            "<18": [
              [
                {
                  "count(*)": 2,
                  gender: "M",
                },
              ],
            ],
          },
          {
            "18+": [
              [
                {
                  "count(*)": 2,
                  gender: "M",
                },
                {
                  "count(*)": 1,
                  gender: "F",
                },
              ],
            ],
          },
        ],
      },
    ];

    // When
    const result = service.flattenData(data);

    // Then
    expect(result).toEqual([
      {
        key: "total reached",
        value: 5,
        level: 0,
      },
      {
        key: "<18",
        value: 2,
        level: 1,
      },
      {
        key: "gender: M",
        value: 2,
        level: 2,
      },
      {
        key: "18+",
        value: 3,
        level: 1,
      },
      {
        key: "gender: M",
        value: 2,
        level: 2,
      },
      {
        key: "gender: F",
        value: 1,
        level: 2,
      },
    ]);
  });
});
