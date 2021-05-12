import { TestBed } from "@angular/core/testing";

import { Aggregation, ReportingService } from "./reporting.service";
import { Child } from "../../child-dev-project/children/model/child";
import { QueryService } from "./query.service";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { Gender } from "../../child-dev-project/children/model/Gender";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";
import { centersUnique } from "../../child-dev-project/children/demo-data-generators/fixtures/centers";

describe("ReportingService", () => {
  let service: ReportingService;
  let mockQueryService: jasmine.SpyObj<QueryService>;
  beforeEach(() => {
    mockQueryService = jasmine.createSpyObj(["queryData"]);
    TestBed.configureTestingModule({
      providers: [{ provide: QueryService, useValue: mockQueryService }],
    });
    service = TestBed.inject(ReportingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should run the aggregation queries and return the results", async () => {
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
      Promise.resolve([new School()]),
      Promise.resolve([new School(), new School()])
    );

    const report = await service.calculateReport();
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [baseQuery, undefined, undefined, undefined],
      [christiansQuery, undefined, undefined, baseData],
      [muslimsQuery, undefined, undefined, baseData],
    ]);
    expect(report).toEqual([
      {
        header: { label: "christians", groupedBy: [], result: 1 },
        subRows: [],
      },
      { header: { label: "muslims", groupedBy: [], result: 2 }, subRows: [] },
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
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [baseQueryString, firstDate, secondDate, undefined],
      [subjectQueryString, firstDate, secondDate, undefined],
    ]);
  });

  it("should create queries for nested aggregations", async () => {
    const baseQuery = `${School.ENTITY_TYPE}:toArray`;
    const nestedBaseQuery = `[*private=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId):getActive`;
    const firstNestedAggregation = `[*schoolClass>3]`;
    const secondNestedAggregation = `[*schoolClass<=3]`;
    const normalAggregation = `[*privateSchool=true]`;
    const aggregation: Aggregation = {
      query: baseQuery,
      label: "Base result",
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
      switch (query) {
        case baseQuery:
          return Promise.resolve(baseData);
        case nestedBaseQuery:
          return Promise.resolve(nestedData);
        default:
          return Promise.resolve([new School()]);
      }
    });
    const result = await service.calculateReport();
    expect(mockQueryService.queryData.calls.allArgs()).toEqual([
      [baseQuery, undefined, undefined, undefined],
      [nestedBaseQuery, undefined, undefined, baseData],
      [firstNestedAggregation, undefined, undefined, nestedData],
      [secondNestedAggregation, undefined, undefined, nestedData],
      [normalAggregation, undefined, undefined, baseData],
    ]);
    expect(result).toEqual([
      {
        header: {
          label: "Base result",
          groupedBy: [],
          result: 2,
        },
        subRows: [
          {
            header: {
              label: "First nested aggregation",
              groupedBy: [],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Second nested aggregation",
              groupedBy: [],
              result: 1,
            },
            subRows: [],
          },
          {
            header: { label: "Normal aggregation", groupedBy: [], result: 1 },
            subRows: [],
          },
        ],
      },
    ]);
  });

  it("should correctly parse groupBy results", async () => {
    const maleChild = new Child();
    maleChild.gender = Gender.MALE;
    const femaleChild = new Child();
    femaleChild.gender = Gender.FEMALE;
    mockQueryService.queryData.and.resolveTo([
      femaleChild,
      maleChild,
      maleChild,
    ]);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
    };

    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      {
        header: { label: "Total # of children", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.FEMALE],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.MALE],
              result: 2,
            },
            subRows: [],
          },
        ],
      },
    ]);
  });

  it("should run aggregations after a groupBy", async () => {
    const maleChild = new Child();
    maleChild.gender = Gender.MALE;
    const femaleChild = new Child();
    femaleChild.gender = Gender.FEMALE;
    mockQueryService.queryData.and.resolveTo([
      maleChild,
      femaleChild,
      maleChild,
    ]);
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
      {
        header: { label: "Total # of children", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of christians",
              groupedBy: [],
              result: 3,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.MALE],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [Gender.MALE],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.FEMALE],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [Gender.FEMALE],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should support groupBy with an array of properties", async () => {
    const alipore = centersUnique.find((c) => c.id === "alipore");
    const barabazar = centersUnique.find((c) => c.id === "barabazar");
    const maleChristianAlipore = new Child();
    maleChristianAlipore.gender = Gender.MALE;
    maleChristianAlipore.religion = "christian";
    maleChristianAlipore.center = alipore;
    const maleMuslimAlipore = new Child();
    maleMuslimAlipore.gender = Gender.MALE;
    maleMuslimAlipore.religion = "muslim";
    maleMuslimAlipore.center = alipore;
    const femaleChristianBarabazar = new Child();
    femaleChristianBarabazar.gender = Gender.FEMALE;
    femaleChristianBarabazar.religion = "christian";
    femaleChristianBarabazar.center = barabazar;
    const femaleChristianAlipore = new Child();
    femaleChristianAlipore.gender = Gender.FEMALE;
    femaleChristianAlipore.religion = "christian";
    femaleChristianAlipore.center = alipore;
    mockQueryService.queryData.and.resolveTo([
      femaleChristianAlipore,
      maleChristianAlipore,
      femaleChristianBarabazar,
      maleMuslimAlipore,
    ]);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender", "religion", "center"],
      label: "Total # of children",
    };
    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      {
        header: { label: "Total # of children", groupedBy: [], result: 4 },
        subRows: [
          {
            header: {
              label: "Total # of children",
              groupedBy: ["Alipore"],
              result: 3,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: ["Barabazar"],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: ["christian"],
              result: 3,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: ["christian", "Alipore"],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: ["christian", "Barabazar"],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: ["muslim"],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: ["muslim", "Alipore"],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.FEMALE],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.FEMALE, "Alipore"],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.FEMALE, "Barabazar"],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.FEMALE, "christian"],
                  result: 2,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [Gender.FEMALE, "christian", "Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [Gender.FEMALE, "christian", "Barabazar"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.MALE],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.MALE, "Alipore"],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.MALE, "christian"],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [Gender.MALE, "christian", "Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [Gender.MALE, "muslim"],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [Gender.MALE, "muslim", "Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should allow multiple groupBy's", async () => {
    const femaleMuslim = new Child();
    femaleMuslim.gender = Gender.FEMALE;
    femaleMuslim.religion = "muslim";
    const femaleChristian = new Child();
    femaleChristian.gender = Gender.FEMALE;
    femaleChristian.religion = "christian";
    const maleMuslim = new Child();
    maleMuslim.gender = Gender.MALE;
    maleMuslim.religion = "muslim";
    mockQueryService.queryData.and.resolveTo([
      femaleChristian,
      femaleMuslim,
      maleMuslim,
      femaleMuslim,
      femaleChristian,
    ]);

    const nestedGroupBy: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
      aggregations: [
        {
          query: `[*age > 13]`,
          groupBy: ["religion"],
          label: "Total # of old children",
        },
      ],
    };
    service.setAggregations([nestedGroupBy]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      {
        header: { label: "Total # of children", groupedBy: [], result: 5 },
        subRows: [
          {
            header: {
              label: "Total # of old children",
              groupedBy: [],
              result: 5,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: ["christian"],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: ["muslim"],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.FEMALE],
              result: 4,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [Gender.FEMALE],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [Gender.FEMALE, "christian"],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [Gender.FEMALE, "muslim"],
                      result: 3,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [Gender.MALE],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [Gender.MALE],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [Gender.MALE, "christian"],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [Gender.MALE, "muslim"],
                      result: 3,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should save label as value when grouping by a configurable enum", async () => {
    const schoolClass = defaultInteractionTypes.find(
      (it) => it.id === "SCHOOL_CLASS"
    );
    const coachingClass = defaultInteractionTypes.find(
      (it) => it.id === "COACHING_CLASS"
    );
    const coachingEvent = new EventNote();
    coachingEvent.category = coachingClass;
    const schoolEvent = new EventNote();
    schoolEvent.category = schoolClass;
    const groupByAggregation: Aggregation = {
      query: `${EventNote.ENTITY_TYPE}`,
      groupBy: ["category"],
      label: "Total # of events",
    };
    mockQueryService.queryData.and.resolveTo([
      coachingEvent,
      schoolEvent,
      schoolEvent,
    ]);
    service.setAggregations([groupByAggregation]);
    const result = await service.calculateReport();

    expect(result).toEqual([
      {
        header: { label: "Total # of events", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of events",
              groupedBy: [coachingClass.label],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of events",
              groupedBy: [schoolClass.label],
              result: 2,
            },
            subRows: [],
          },
        ],
      },
    ]);
  });

  it("should display an explanation when a groupBy result has no value", async () => {
    const hindiSchool = new School();
    hindiSchool.medium = "Hindi";
    const schoolWithoutMedium = new School();
    mockQueryService.queryData.and.resolveTo([
      schoolWithoutMedium,
      hindiSchool,
      schoolWithoutMedium,
    ]);
    const groupByAggregation: Aggregation = {
      query: `${School.ENTITY_TYPE}`,
      groupBy: ["medium"],
      label: "Total # of schools",
    };
    service.setAggregations([groupByAggregation]);

    const result = await service.calculateReport();
    expect(result).toEqual([
      {
        header: { label: "Total # of schools", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of schools",
              groupedBy: ["without medium"],
              result: 2,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of schools",
              groupedBy: ["Hindi"],
              result: 1,
            },
            subRows: [],
          },
        ],
      },
    ]);
  });

  it("should correctly display groupBys on boolean properties", async () => {
    const privateSchool = new School();
    privateSchool.privateSchool = true;
    const normalSchool = new School();
    normalSchool.privateSchool = false;
    mockQueryService.queryData.and.resolveTo([privateSchool, normalSchool]);
    const privateSchoolsGroupBy = {
      query: `${School.ENTITY_TYPE}:toArray`,
      groupBy: ["privateSchool"],
      label: "Total # of schools",
    };
    service.setAggregations([privateSchoolsGroupBy]);

    const result = await service.calculateReport();

    expect(result).toEqual([
      {
        header: { label: "Total # of schools", groupedBy: [], result: 2 },
        subRows: [
          {
            header: {
              label: "Total # of schools",
              groupedBy: ["privateSchool"],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of schools",
              groupedBy: ["not privateSchool"],
              result: 1,
            },
            subRows: [],
          },
        ],
      },
    ]);
  });
});
