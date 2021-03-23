import { TestBed } from "@angular/core/testing";

import { Disaggregation, ReportingService } from "./reporting.service";
import { Child } from "../children/model/child";
import { QueryService } from "./query.service";
import { EventNote } from "../attendance/model/event-note";
import moment from "moment";

describe("ReportingService", () => {
  let service: ReportingService;
  let mockQueryService: jasmine.SpyObj<QueryService>;

  beforeEach(() => {
    mockQueryService = jasmine.createSpyObj([
      "queryAllData",
      "queryData",
      "loadData",
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: QueryService, useValue: mockQueryService }],
    });
    service = TestBed.inject(ReportingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should run the disaggregation queries and return the results", async () => {
    const baseQuery = `${Child.ENTITY_TYPE}:toArray`;
    const christiansQuery = "[*religion=christian]";
    const muslimsQuery = "[*religion=muslim]";
    const childDisaggregation: Disaggregation = {
      baseQuery: baseQuery,
      aggregations: [
        { label: "christians", query: christiansQuery },
        { label: "muslims", query: muslimsQuery },
      ],
    };
    service.setDisaggregations([childDisaggregation]);

    mockQueryService.queryData.and.returnValues(
      Promise.resolve(1),
      Promise.resolve(2)
    );

    const report = await service.calculateReport();
    expect(mockQueryService.loadData).toHaveBeenCalled();
    expect(mockQueryService.queryAllData).toHaveBeenCalledWith([baseQuery]);
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[christiansQuery], undefined],
      [[muslimsQuery], undefined],
    ]);
    expect(report).toEqual([
      { label: "christians", result: 1 },
      { label: "muslims", result: 2 },
    ]);
  });

  it("should add the date to each query", async () => {
    const baseQueryString = `${EventNote.ENTITY_TYPE}:toArray[*date>=? date<?]`;
    const firstDate = moment().subtract(1, "month").toDate();
    const secondDate = moment().subtract(1, "week").toDate();
    const subjectQueryString = `[*subject=test]`;
    const disaggregation: Disaggregation = {
      baseQuery: baseQueryString,
      aggregations: [{ label: "tests", query: subjectQueryString }],
    };
    service.setDisaggregations([disaggregation]);

    await service.calculateReport(firstDate, secondDate);
    expect(mockQueryService.loadData).toHaveBeenCalled();
    expect(mockQueryService.queryAllData).toHaveBeenCalledWith([
      baseQueryString,
      firstDate,
      secondDate,
    ]);
    expect(mockQueryService.queryData).toHaveBeenCalledWith(
      [subjectQueryString, firstDate, secondDate],
      undefined
    );
  });
});
