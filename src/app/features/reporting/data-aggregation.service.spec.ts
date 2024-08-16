import { TestBed } from "@angular/core/testing";

import {
  Aggregation,
  DataAggregationService,
} from "./data-aggregation.service";
import { QueryService } from "../../core/export/query.service";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { genders } from "../../child-dev-project/children/model/genders";
import { mockEntityMapper } from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { entityRegistry } from "../../core/entity/database-entity.decorator";
import { createEntityOfType } from "../../core/demo-data/create-entity-of-type";
import { TestEntity } from "../../utils/test-utils/TestEntity";

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
    const baseQuery = `Child:toArray`;
    const christiansQuery = "[*religion=christian]";
    const muslimsQuery = "[*religion=muslim]";
    const childDisaggregation: Aggregation = {
      query: baseQuery,
      aggregations: [
        { label: "christians", query: christiansQuery },
        { label: "muslims", query: muslimsQuery },
      ],
    };
    const baseData = [createEntityOfType("School")];
    mockQueryService.queryData.and.returnValues(
      baseData,
      [createEntityOfType("School")],
      [createEntityOfType("School"), createEntityOfType("School")],
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
    const baseQuery = `School:toArray`;
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

    const baseData = [
      createEntityOfType("School"),
      createEntityOfType("School"),
    ];
    const nestedData = [new ChildSchoolRelation()];
    mockQueryService.queryData.and.callFake((query) => {
      switch (query) {
        case baseQuery:
          return baseData;
        case nestedBaseQuery:
          return nestedData;
        default:
          return [createEntityOfType("School")];
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
    const maleChild = new TestEntity();
    maleChild.category = genders[1];
    const femaleChild = new TestEntity();
    femaleChild.category = genders[2];
    mockQueryService.queryData.and.returnValue([
      femaleChild,
      maleChild,
      maleChild,
    ]);
    const groupByAggregation: Aggregation = {
      query: TestEntity.ENTITY_TYPE,
      groupBy: ["category"],
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
              groupedBy: [{ property: "category", value: genders[2] }],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "category", value: genders[1] }],
              result: 2,
            },
            subRows: [],
          },
        ],
      },
    ]);
  });

  it("should run aggregations after a groupBy", async () => {
    const maleChild = new TestEntity();
    maleChild.category = genders[1];
    const femaleChild = new TestEntity();
    femaleChild.category = genders[2];
    mockQueryService.queryData.and.returnValue([
      maleChild,
      femaleChild,
      maleChild,
    ]);
    const groupByAggregation: Aggregation = {
      query: TestEntity.ENTITY_TYPE,
      groupBy: ["category"],
      label: "Total # of children",
      aggregations: [
        { query: `[*name=christian]`, label: "Total # of christians" },
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
              groupedBy: [{ property: "category", value: genders[1] }],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "category", value: genders[1] }],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "category", value: genders[2] }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of christians",
                  groupedBy: [{ property: "category", value: genders[2] }],
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
    const n1 = "name_1";
    const n2 = "name_2";
    const male1 = new TestEntity();
    male1.category = genders[1];
    male1.name = n1;
    const male2 = new TestEntity();
    male2.category = genders[1];
    male2.name = n2;
    const female1 = new TestEntity();
    female1.category = genders[2];
    female1.name = n1;
    const female1b = new TestEntity();
    female1b.category = genders[2];
    female1b.name = n1;
    mockQueryService.queryData.and.returnValue([
      female1b,
      male1,
      female1,
      male2,
    ]);
    const groupByAggregation: Aggregation = {
      query: TestEntity.ENTITY_TYPE,
      groupBy: ["category", "name"],
      label: "Total # of children",
    };
    const result = await service.calculateReport([groupByAggregation]);

    expect(result).toEqual([
      {
        header: {
          label: "Total # of children",
          groupedBy: [],
          result: 4,
        },
        subRows: [
          {
            header: {
              label: "Total # of children",
              groupedBy: [
                {
                  property: "name",
                  value: n1,
                },
              ],
              result: 3,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [
                {
                  property: "name",
                  value: n2,
                },
              ],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [
                {
                  property: "category",
                  value: genders[2],
                },
              ],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    {
                      property: "category",
                      value: genders[2],
                    },
                    {
                      property: "name",
                      value: n1,
                    },
                  ],
                  result: 2,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [
                {
                  property: "category",
                  value: genders[1],
                },
              ],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    {
                      property: "category",
                      value: genders[1],
                    },
                    {
                      property: "name",
                      value: n1,
                    },
                  ],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  groupedBy: [
                    {
                      property: "category",
                      value: genders[1],
                    },
                    {
                      property: "name",
                      value: n2,
                    },
                  ],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should allow multiple groupBy's", async () => {
    const femaleMuslim = new TestEntity();
    femaleMuslim.category = genders[2];
    femaleMuslim.name = "muslim";
    const femaleChristian = new TestEntity();
    femaleChristian.category = genders[2];
    femaleChristian.name = "christian";
    const maleMuslim = new TestEntity();
    maleMuslim.category = genders[1];
    maleMuslim.name = "muslim";
    mockQueryService.queryData.and.returnValue([
      femaleChristian,
      femaleMuslim,
      maleMuslim,
      femaleMuslim,
      femaleChristian,
    ]);

    const nestedGroupBy: Aggregation = {
      query: `Child`,
      groupBy: ["category"],
      label: "Total # of children",
      aggregations: [
        {
          query: `[*isActive = true]`,
          groupBy: ["name"],
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
                  groupedBy: [{ property: "name", value: "christian" }],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "name", value: "muslim" }],
                  result: 3,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              groupedBy: [{ property: "category", value: genders[2] }],
              result: 4,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "category", value: genders[2] }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "category", value: genders[2] },
                        { property: "name", value: "christian" },
                      ],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "category", value: genders[2] },
                        { property: "name", value: "muslim" },
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
              groupedBy: [{ property: "category", value: genders[1] }],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of old children",
                  groupedBy: [{ property: "category", value: genders[1] }],
                  result: 5,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "category", value: genders[1] },
                        { property: "name", value: "christian" },
                      ],
                      result: 2,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of old children",
                      groupedBy: [
                        { property: "category", value: genders[1] },
                        { property: "name", value: "muslim" },
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
    const c1 = new TestEntity();
    c1.name = "1";

    const entityMapper = mockEntityMapper([c1]);
    const queryService = new QueryService(
      entityMapper,
      null,
      null,
      entityRegistry,
    );
    service = new DataAggregationService(queryService);

    const complexQuery: Aggregation = {
      label: "!!",
      query: "TestEntity:toArray.name",
    };
    const otherQuery: Aggregation = {
      label: "other",
      query: "OtherEntity:toArray",
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
