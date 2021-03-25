import { TestBed } from "@angular/core/testing";

import { Aggregation, ReportingService } from "./reporting.service";
import { Child } from "../children/model/child";
import { QueryService } from "./query.service";
import { EventNote } from "../attendance/model/event-note";
import moment from "moment";
import { School } from "../schools/model/school";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";

describe("ReportingService", () => {
  let service: ReportingService;
  let mockQueryService: jasmine.SpyObj<QueryService>;

  beforeEach(() => {
    mockQueryService = jasmine.createSpyObj(["queryData", "loadData"]);
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
    const childDisaggregation: Aggregation = {
      query: baseQuery,
      aggregations: [
        { label: "christians", query: christiansQuery },
        { label: "muslims", query: muslimsQuery },
      ],
    };
    service.setAggregations([childDisaggregation]);
    const baseData = [new School()];
    mockQueryService.queryData.and.returnValues(
      Promise.resolve(baseData),
      Promise.resolve(1),
      Promise.resolve(2)
    );

    const report = await service.calculateReport();
    expect(mockQueryService.loadData).toHaveBeenCalled();
    console.log("all args", mockQueryService.queryData.calls.allArgs());
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[baseQuery], undefined],
      [[christiansQuery], baseData],
      [[muslimsQuery], baseData],
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
    const disaggregation: Aggregation = {
      query: baseQueryString,
      aggregations: [{ label: "tests", query: subjectQueryString }],
    };
    service.setAggregations([disaggregation]);

    await service.calculateReport(firstDate, secondDate);
    expect(mockQueryService.loadData).toHaveBeenCalled();
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[baseQueryString, firstDate, secondDate], undefined],
      [[subjectQueryString, firstDate, secondDate], undefined],
    ]);
  });

  it("should create queries for nested aggregations", async () => {
    const baseQuery = `${School.ENTITY_TYPE}:toArray`;
    const nestedBaseQuery = `[*private=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId):getActive`;
    const firstNestedAggregation = `[*schoolClass>3]:count`;
    const secondNestedAggregation = `[*schoolClass<=3]:count`;
    const normalAggregation = `:count`;
    const aggregation: Aggregation = {
      query: baseQuery,
      aggregations: [
        {
          query: nestedBaseQuery,
          aggregations: [
            {
              label: "First nested aggregation",
              query: firstNestedAggregation,
            },
            {
              label: "Second nested aggregation",
              query: secondNestedAggregation,
            },
          ],
        },
        { label: "Normal aggregation", query: normalAggregation },
      ],
    };
    service.setAggregations([aggregation]);

    const baseData = [new School(), new School()];
    const nestedData = [new ChildSchoolRelation()];
    mockQueryService.queryData.and.callFake((query) => {
      switch (query[0]) {
        case baseQuery:
          return Promise.resolve(baseData);
        case nestedBaseQuery:
          return Promise.resolve(nestedData);
        default:
          return Promise.resolve();
      }
    });
    await service.calculateReport();
    expect(mockQueryService.loadData).toHaveBeenCalled();
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[baseQuery], undefined],
      [[nestedBaseQuery], baseData],
      [[firstNestedAggregation], nestedData],
      [[secondNestedAggregation], nestedData],
      [[normalAggregation], baseData],
    ]);
  });
});
