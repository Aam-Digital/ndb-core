import { TestBed } from "@angular/core/testing";

import { Aggregation, ReportingService } from "./reporting.service";
import { Child } from "../../child-dev-project/children/model/child";
import { QueryService } from "./query.service";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { Gender } from "../../child-dev-project/children/model/Gender";
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
              groupedBy: [{ property: "gender", value: Gender.FEMALE }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: Gender.MALE }],
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
              groupedBy: [{ property: "gender", value: Gender.MALE }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "gender", value: Gender.MALE }],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: Gender.FEMALE }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "gender", value: Gender.FEMALE }],
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
              groupedBy: [{ property: "center", value: alipore }],
              result: 3,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "center", value: barabazar }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "religion", value: "christian" }],
              result: 3,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "religion", value: "christian" },
                    { property: "center", value: alipore },
                  ],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "religion", value: "christian" },
                    { property: "center", value: barabazar },
                  ],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "religion", value: "muslim" }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "religion", value: "muslim" },
                    { property: "center", value: alipore },
                  ],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: Gender.FEMALE }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.FEMALE },
                    { property: "center", value: alipore },
                  ],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.FEMALE },
                    { property: "center", value: barabazar },
                  ],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.FEMALE },
                    { property: "religion", value: "christian" },
                  ],
                  result: 2,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: Gender.FEMALE },
                        { property: "religion", value: "christian" },
                        { property: "center", value: alipore },
                      ],
                      result: 1,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: Gender.FEMALE },
                        { property: "religion", value: "christian" },
                        { property: "center", value: barabazar },
                      ],
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
              groupedBy: [{ property: "gender", value: Gender.MALE }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.MALE },
                    { property: "center", value: alipore },
                  ],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.MALE },
                    { property: "religion", value: "christian" },
                  ],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: Gender.MALE },
                        { property: "religion", value: "christian" },
                        { property: "center", value: alipore },
                      ],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: Gender.MALE },
                    { property: "religion", value: "muslim" },
                  ],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: Gender.MALE },
                        { property: "religion", value: "muslim" },
                        { property: "center", value: alipore },
                      ],
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
                  groupedBy: [{ property: "religion", value: "christian" }],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "religion", value: "muslim" }],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: Gender.FEMALE }],
              result: 4,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "gender", value: Gender.FEMALE }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: Gender.FEMALE },
                        { property: "religion", value: "christian" },
                      ],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: Gender.FEMALE },
                        { property: "religion", value: "muslim" },
                      ],
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
              groupedBy: [{ property: "gender", value: Gender.MALE }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "gender", value: Gender.MALE }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: Gender.MALE },
                        { property: "religion", value: "christian" },
                      ],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: Gender.MALE },
                        { property: "religion", value: "muslim" },
                      ],
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
});
