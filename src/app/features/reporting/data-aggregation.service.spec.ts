import { TestBed } from "@angular/core/testing";

import {
  Aggregation,
  DataAggregationService,
} from "./data-aggregation.service";
import { Child } from "../../child-dev-project/children/model/child";
import { QueryService } from "../../core/export/query.service";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { centersUnique } from "../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { genders } from "../../child-dev-project/children/model/genders";
import { mockEntityMapper } from "../../core/entity/mock-entity-mapper-service";
import { entityRegistry } from "../../core/entity/database-entity.decorator";

describe("DataAggregationService", () => {
  let service: DataAggregationService;
  let mockQueryService: jasmine.SpyObj<QueryService>;
  beforeEach(() => {
    mockQueryService = jasmine.createSpyObj(["queryData", "cacheRequiredData"]);
    TestBed.configureTestingModule({
      providers: [{ provide: QueryService, useValue: mockQueryService }],
    });
    service = TestBed.inject(DataAggregationService);
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
    const baseData = [new School()];
    mockQueryService.queryData.and.returnValues(
      baseData,
      [new School()],
      [new School(), new School()]
    );

    const report = await service.calculateReport([childDisaggregation]);
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

    await service.calculateReport([disaggregation], firstDate, secondDate);
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

    const baseData = [new School(), new School()];
    const nestedData = [new ChildSchoolRelation()];
    mockQueryService.queryData.and.callFake((query) => {
      switch (query) {
        case baseQuery:
          return baseData;
        case nestedBaseQuery:
          return nestedData;
        default:
          return [new School()];
      }
    });
    const result = await service.calculateReport([aggregation]);
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
    maleChild.gender = genders[1];
    const femaleChild = new Child();
    femaleChild.gender = genders[2];
    mockQueryService.queryData.and.returnValue([
      femaleChild,
      maleChild,
      maleChild,
    ]);
    const groupByAggregation: Aggregation = {
      query: `${Child.ENTITY_TYPE}`,
      groupBy: ["gender"],
      label: "Total # of children",
    };

    const result = await service.calculateReport([groupByAggregation]);

    expect(result).toEqual([
      {
        header: { label: "Total # of children", groupedBy: [], result: 3 },
        subRows: [
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: genders[2] }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: genders[1] }],
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
    maleChild.gender = genders[1];
    const femaleChild = new Child();
    femaleChild.gender = genders[2];
    mockQueryService.queryData.and.returnValue([
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

    const result = await service.calculateReport([groupByAggregation]);

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
              groupedBy: [{ property: "gender", value: genders[1] }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "gender", value: genders[1] }],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "gender", value: genders[2] }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "gender", value: genders[2] }],
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
    maleChristianAlipore.gender = genders[1];
    maleChristianAlipore["religion"] = "christian";
    maleChristianAlipore.center = alipore;
    const maleMuslimAlipore = new Child();
    maleMuslimAlipore.gender = genders[1];
    maleMuslimAlipore["religion"] = "muslim";
    maleMuslimAlipore.center = alipore;
    const femaleChristianBarabazar = new Child();
    femaleChristianBarabazar.gender = genders[2];
    femaleChristianBarabazar["religion"] = "christian";
    femaleChristianBarabazar.center = barabazar;
    const femaleChristianAlipore = new Child();
    femaleChristianAlipore.gender = genders[2];
    femaleChristianAlipore["religion"] = "christian";
    femaleChristianAlipore.center = alipore;
    mockQueryService.queryData.and.returnValue([
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
    const result = await service.calculateReport([groupByAggregation]);

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
              groupedBy: [{ property: "gender", value: genders[2] }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: genders[2] },
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
                    { property: "gender", value: genders[2] },
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
                    { property: "gender", value: genders[2] },
                    { property: "religion", value: "christian" },
                  ],
                  result: 2,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: genders[2] },
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
                        { property: "gender", value: genders[2] },
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
              groupedBy: [{ property: "gender", value: genders[1] }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    { property: "gender", value: genders[1] },
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
                    { property: "gender", value: genders[1] },
                    { property: "religion", value: "christian" },
                  ],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: genders[1] },
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
                    { property: "gender", value: genders[1] },
                    { property: "religion", value: "muslim" },
                  ],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      groupedBy: [
                        { property: "gender", value: genders[1] },
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
    femaleMuslim.gender = genders[2];
    femaleMuslim["religion"] = "muslim";
    const femaleChristian = new Child();
    femaleChristian.gender = genders[2];
    femaleChristian["religion"] = "christian";
    const maleMuslim = new Child();
    maleMuslim.gender = genders[1];
    maleMuslim["religion"] = "muslim";
    mockQueryService.queryData.and.returnValue([
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
    const result = await service.calculateReport([nestedGroupBy]);

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
              groupedBy: [{ property: "gender", value: genders[2] }],
              result: 4,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "gender", value: genders[2] }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: genders[2] },
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
                        { property: "gender", value: genders[2] },
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
              groupedBy: [{ property: "gender", value: genders[1] }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "gender", value: genders[1] }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "gender", value: genders[1] },
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
                        { property: "gender", value: genders[1] },
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

  it("should handle subfields of filtered query anywhere in the reporting structure", async () => {
    const c1 = new Child();
    c1.status = "1";

    const entityMapper = mockEntityMapper([c1]);
    const queryService = new QueryService(
      entityMapper,
      null,
      null,
      entityRegistry
    );
    service = new DataAggregationService(queryService);

    const complexQuery: Aggregation = {
      label: "!!",
      query: "Child:toArray.status",
    };
    const otherQuery: Aggregation = {
      label: "other",
      query: "School:toArray",
    };

    const result = await service.calculateReport([complexQuery, otherQuery]);

    expect(result).toEqual([
      {
        header: { label: "!!", groupedBy: [], result: 1 },
        subRows: [],
      },
      { header: { label: "other", groupedBy: [], result: 0 }, subRows: [] },
    ]);
  });
});
