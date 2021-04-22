import { TestBed } from "@angular/core/testing";

import { Aggregation, ReportingService } from "./reporting.service";
import { Child } from "../children/model/child";
import { QueryService } from "./query.service";
import { EventNote } from "../attendance/model/event-note";
import moment from "moment";
import { School } from "../schools/model/school";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { GroupingResult, GroupingService } from "./grouping.service";
import { Gender } from "../children/model/Gender";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";

describe("ReportingService", () => {
  let service: ReportingService;
  let mockQueryService: jasmine.SpyObj<QueryService>;
  let mockGroupingService: jasmine.SpyObj<GroupingService>;
  beforeEach(() => {
    mockQueryService = jasmine.createSpyObj(["queryData", "loadData"]);
    mockGroupingService = jasmine.createSpyObj(["groupBy"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: QueryService, useValue: mockQueryService },
        { provide: GroupingService, useValue: mockGroupingService },
      ],
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
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[baseQuery], undefined],
      [[christiansQuery], baseData],
      [[muslimsQuery], baseData],
    ]);
    expect(report).toEqual([
      { header: { label: "christians", result: 1 } },
      { header: { label: "muslims", result: 2 } },
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
          return Promise.resolve(1);
      }
    });
    const result = await service.calculateReport();
    expect(mockQueryService.loadData).toHaveBeenCalled();
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [[baseQuery], undefined],
      [[nestedBaseQuery], baseData],
      [[firstNestedAggregation], nestedData],
      [[secondNestedAggregation], nestedData],
      [[normalAggregation], baseData],
    ]);
    expect(result).toEqual([
      {
        header: {
          label: "First nested aggregation",
          result: 1,
        },
      },
      {
        header: {
          label: "Second nested aggregation",
          result: 1,
        },
      },
      { header: { label: "Normal aggregation", result: 1 } },
    ]);
  });

  it("should correctly parse groupBy results", async () => {
    const groupByGenderResult: any = [
      { values: {}, data: [new Child(), new Child(), new Child()] },
      { values: { gender: Gender.FEMALE }, data: [new Child(), new Child()] },
      { values: { gender: Gender.MALE }, data: [new Child()] },
    ];
    mockGroupingService.groupBy.and.returnValue(groupByGenderResult);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
    };
    service.setAggregations([groupByAggregation]);

    const result = await service.calculateReport();
    console.log("result", result);
    expect(result).toEqual([
      {
        header: { label: "Total # of children", result: 3 },
        subRows: [
          { header: { label: "Total # of children (F)", result: 2 } },
          { header: { label: "Total # of children (M)", result: 1 } },
        ],
      },
    ]);
  });

  it("should run aggregations after a groupBy", async () => {
    const groupByGenderResult: any = [
      { values: {}, data: [new Child(), new Child(), new Child()] },
      { values: { gender: Gender.FEMALE }, data: [new Child(), new Child()] },
      { values: { gender: Gender.MALE }, data: [new Child()] },
    ];
    mockGroupingService.groupBy.and.returnValue(groupByGenderResult);
    mockQueryService.queryData.and.resolveTo(1);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
      aggregations: [
        { query: `[*religion=christian]`, label: "Total # of christians" },
      ],
    };
    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      { header: { label: "Total # of children", result: 3 } },
      { header: { label: "Total # of children (F)", result: 2 } },
      { header: { label: "Total # of children (M)", result: 1 } },
      { header: { label: "Total # of christians", result: 1 } },
      { header: { label: "Total # of christians (F)", result: 1 } },
      { header: { label: "Total # of christians (M)", result: 1 } },
    ]);
  });

  it("should support groupBy with an array of values", async () => {
    const groupByGenderAndReligion: any = [
      { values: {}, data: [new Child(), new Child(), new Child()] },
      { values: { gender: Gender.FEMALE }, data: [new Child(), new Child()] },
      { values: { gender: Gender.MALE }, data: [new Child()] },
      {
        values: { gender: Gender.MALE, religion: "christian" },
        data: [new Child()],
      },
      {
        values: { gender: Gender.FEMALE, religion: "muslim" },
        data: [new Child()],
      },
      {
        values: { gender: Gender.FEMALE, religion: "christian" },
        data: [new Child()],
      },
    ];
    mockGroupingService.groupBy.and.returnValue(groupByGenderAndReligion);
    mockQueryService.queryData.and.resolveTo(1);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender", "religion"],
      label: "Total # of children",
    };
    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      { header: { label: "Total # of children", result: 3 } },
      { header: { label: "Total # of children (F)", result: 2 } },
      { header: { label: "Total # of children (M)", result: 1 } },
      { header: { label: "Total # of children (M, christian)", result: 1 } },
      { header: { label: "Total # of children (F, muslim)", result: 1 } },
      { header: { label: "Total # of children (F, christian)", result: 1 } },
    ]);
  });

  it("should allow multiple groupBy's", async () => {
    const groupByGender: any = [
      { values: {}, data: [new Child(), new Child(), new Child()] },
      { values: { gender: Gender.FEMALE }, data: [new Child(), new Child()] },
      { values: { gender: Gender.MALE }, data: [new Child()] },
    ];
    const groupByReligion: any = [
      { values: {}, data: [new Child(), new Child()] },
      { values: { religion: "christian" }, data: [new Child()] },
      { values: { religion: "muslim" }, data: [new Child()] },
    ];
    // return the same results for each entry of the first groupBy
    mockGroupingService.groupBy.and.returnValues(
      groupByGender,
      groupByReligion,
      groupByReligion,
      groupByReligion
    );
    mockQueryService.queryData.and.resolveTo([]);

    const nestedGroupBy: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
      aggregations: [
        {
          query: `[*age > 13]`,
          groupBy: ["religion"],
          label: "Total # of children",
        },
      ],
    };
    service.setAggregations([nestedGroupBy]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      { header: { label: "Total # of children", result: 3 } },
      { header: { label: "Total # of children (F)", result: 2 } },
      { header: { label: "Total # of children (M)", result: 1 } },
      { header: { label: "Total # of children (christian)", result: 1 } },
      { header: { label: "Total # of children (muslim)", result: 1 } },
      { header: { label: "Total # of children (F, christian)", result: 1 } },
      { header: { label: "Total # of children (F, muslim)", result: 1 } },
      { header: { label: "Total # of children (M, christian)", result: 1 } },
      { header: { label: "Total # of children (M, muslim)", result: 1 } },
    ]);
  });

  it("should display labels when grouping by a configurable enum", async () => {
    const schoolClass = defaultInteractionTypes.find(
      (it) => it.id === "SCHOOL_CLASS"
    );
    const coachingClass = defaultInteractionTypes.find(
      (it) => it.id === "COACHING_CLASS"
    );
    const groupByCategory: any = [
      { values: {}, data: [new EventNote(), new EventNote(), new EventNote()] },
      { values: { category: schoolClass }, data: [new EventNote()] },
      {
        values: { category: coachingClass },
        data: [new EventNote(), new EventNote()],
      },
    ];
    mockGroupingService.groupBy.and.returnValue(groupByCategory);
    const groupByAggregation: Aggregation = {
      query: `${EventNote.ENTITY_TYPE}`,
      groupBy: ["category"],
      label: "Total # of events",
    };
    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      { header: { label: "Total # of events", result: 3 } },
      {
        header: {
          label: `Total # of events (${schoolClass.label})`,
          result: 1,
        },
      },
      {
        header: {
          label: `Total # of events (${coachingClass.label})`,
          result: 2,
        },
      },
    ]);
  });

  it("should display an explanation when a groupBy-group has no value", async () => {
    const groupByMedium: any = [
      { values: {}, data: [new School(), new School()] },
      { values: { medium: "Hindi" }, data: [new School()] },
      { values: { medium: "" }, data: [new School()] },
    ];
    mockGroupingService.groupBy.and.returnValue(groupByMedium);
    const groupByAggregation: Aggregation = {
      query: `${School.ENTITY_TYPE}`,
      groupBy: ["medium"],
      label: "Total # of schools",
    };
    service.setAggregations([groupByAggregation]);

    const result = await service.calculateReport();
    expect(result).toEqual([
      { header: { label: "Total # of schools", result: 2 } },
      { header: { label: "Total # of schools (Hindi)", result: 1 } },
      { header: { label: "Total # of schools (without medium)", result: 1 } },
    ]);
  });
});
