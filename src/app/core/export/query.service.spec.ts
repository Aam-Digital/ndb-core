import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import moment from "moment";

import {
  AttendanceInfo,
  AttendanceReport,
  QueryService,
} from "./query.service";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { Note } from "../../child-dev-project/notes/model/note";
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";
import { AttendanceStatusType } from "#src/app/features/attendance/model/attendance-status";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "#src/app/features/attendance/attendance.service";
import { EventWithAttendance } from "#src/app/features/attendance/model/event-with-attendance";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { DefaultDatatype } from "../entity/default-datatype/default.datatype";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { TestEventEntity } from "../../utils/test-utils/TestEventEntity";
import { defaultAttendanceStatusTypes } from "../config/default-config/default-attendance-status-types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import type { Mock } from "vitest";

type ChildrenServiceMock = {
  getNotesInTimespan: Mock;
};

type AttendanceServiceMock = {
  getEventsOnDate: Mock;
  wrapEventEntity: Mock;
  eventTypes: ReturnType<typeof signal>;
};

// Note that we used to have more realistic tests here using the DatabaseTestingModule.
// These have been replace with more focused, isolated unit tests using mocked services.
// refer back to previous git versions for the old tests: https://github.com/Aam-Digital/ndb-core/blob/7b889418809c1f9d46cbe959b2bfb90e7534fce6/src/app/core/export/query.service.spec.ts
// We may re-implement those as full e2e tests in the future if needed.

describe("QueryService", () => {
  let service: QueryService;
  let mockEntityMapper: MockEntityMapperService;
  let mockChildrenService: ChildrenServiceMock;
  let mockAttendanceService: AttendanceServiceMock;
  let mockEntityRegistry: EntityRegistry;

  const presentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "PRESENT",
  );
  const absentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "ABSENT",
  );
  const ignoreAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "IGNORE",
  );

  beforeEach(() => {
    mockChildrenService = {
      getNotesInTimespan: vi
        .fn()
        .mockName("ChildrenService.getNotesInTimespan"),
    };
    mockChildrenService.getNotesInTimespan.mockReturnValue(Promise.resolve([]));

    mockAttendanceService = {
      getEventsOnDate: vi.fn().mockName("AttendanceService.getEventsOnDate"),
      wrapEventEntity: vi.fn().mockName("AttendanceService.wrapEventEntity"),
      eventTypes: signal([TestEventEntity]),
    };
    mockAttendanceService.getEventsOnDate.mockReturnValue(Promise.resolve([]));
    mockAttendanceService.wrapEventEntity.mockImplementation(
      (e) =>
        new EventWithAttendance(
          e,
          "attendance",
          "date",
          "relatesTo",
          "authors",
          undefined,
        ),
    );

    mockEntityRegistry = new EntityRegistry();
    mockEntityRegistry.add(TestEntity.ENTITY_TYPE, TestEntity);
    mockEntityRegistry.add("Note", Note);
    mockEntityRegistry.add("TestEventEntity", TestEventEntity);
    mockEntityRegistry.add("ChildSchoolRelation", ChildSchoolRelation);

    TestBed.configureTestingModule({
      providers: [
        QueryService,
        mockEntityMapperProvider([]),
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
        { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
      ],
    });
    service = TestBed.inject(QueryService);
    mockEntityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  describe("queryData", () => {
    it("should execute simple queries on custom data", () => {
      const customData = { items: [{ value: 1 }, { value: 2 }, { value: 3 }] };
      const result = service.queryData(
        "items[*value>1]",
        null,
        null,
        customData,
      );

      expect(result.length).toBe(2);
      expect(result[0].value).toBe(2);
      expect(result[1].value).toBe(3);
    });

    it("should use default dates when from/to are not provided", () => {
      const customData = [1, 2, 3];
      const result = service.queryData(
        ":count",
        undefined,
        undefined,
        customData,
      );

      expect(result).toBe(3);
    });

    it("should expose helper functions to json-query", () => {
      const data = [1, 2, 3, 4, 5];

      expect(service.queryData(":count", null, null, data)).toBe(5);
      expect(service.queryData(":sum", null, null, data)).toBe(15);
      expect(service.queryData(":unique", null, null, [1, 1, 2, 2, 3])).toEqual(
        [1, 2, 3],
      );
    });
  });

  describe("cacheRequiredData", () => {
    it("should load Note entities using dataFunction", async () => {
      const note = Note.create(new Date());
      mockChildrenService.getNotesInTimespan.mockResolvedValue([note]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("Note:toArray", from, to);

      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledWith(
        from,
        to,
      );
      const result = service.queryData("Note:toArray");
      expect(result.length).toBe(1);
      expect(result[0].getId()).toBe(note.getId());
    });

    it("should load event entities using dataFunction", async () => {
      const event = createEvent(new Date());
      mockAttendanceService.getEventsOnDate.mockResolvedValue([event]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("TestEventEntity:toArray", from, to);

      expect(mockAttendanceService.getEventsOnDate).toHaveBeenCalledWith(
        from,
        to,
      );
      const result = service.queryData("TestEventEntity:toArray");
      expect(result.length).toBe(1);
    });

    it("should not reload entities when requested range is within cached range", async () => {
      mockChildrenService.getNotesInTimespan.mockResolvedValue([]);

      const from = moment().subtract(2, "weeks").toDate();
      const to = new Date();
      await service.cacheRequiredData("Note:toArray", from, to);
      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(1);

      const narrowFrom = moment().subtract(1, "week").toDate();
      await service.cacheRequiredData("Note:toArray", narrowFrom, to);

      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(1);
    });

    it("should reload entities when requested range extends beyond cached range", async () => {
      mockChildrenService.getNotesInTimespan.mockResolvedValue([]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("Note:toArray", from, to);
      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(1);

      const extendedFrom = moment().subtract(2, "weeks").toDate();
      await service.cacheRequiredData("Note:toArray", extendedFrom, to);

      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(2);
    });

    it("should remove entity from cache when receiveUpdates emits remove event", async () => {
      const entity1 = TestEntity.create({ name: "Entity 1" });
      const entity2 = TestEntity.create({ name: "Entity 2" });
      mockEntityMapper.addAll([entity1, entity2]);

      await service.cacheRequiredData(
        "TestEntity:toArray",
        new Date(0),
        new Date(),
      );

      let result = service.queryData("TestEntity:toArray");
      expect(result.length).toBe(2);

      // Simulate entity removal
      mockEntityMapper.remove(entity1);

      result = service.queryData("TestEntity:toArray");
      expect(result.length).toBe(1);
      expect(result[0].getId()).toBe(entity2.getId());
    });
  });

  describe("query helper functions", () => {
    /**
     * The stateless helper expressions are a pure input -> output contract, so they are
     * covered as one table: it keeps the full set of supported expressions - and the gaps
     * between them, e.g. that only :sum and :avg coerce string numbers - visible at a glance.
     */
    it.each([
      // :toArray - the object's values, in insertion order
      [":toArray", { a: 1, b: 2, c: 3 }, [1, 2, 3]],
      [":toArray", {}, []],

      // :unique - de-duplicate, keeping the first occurrence
      [":unique", [1, 2, 2, 3, 3, 3, 4], [1, 2, 3, 4]],
      [":unique", [], []],

      // :count - array length
      [":count", [1, 2, 3, 4, 5], 5],
      [":count", [], 0],

      // :sum - numeric total; string numbers are coerced, anything else ignored
      [":sum", [1, 2, 3, 4], 10],
      [":sum", ["1", "2", "3"], 6],
      [":sum", ["1", "invalid", "3", null, undefined], 4],
      [":sum", [], 0],

      // :avg - mean as a string, rounded to the requested number of decimals
      [":avg", [10, 20, 30], "20"],
      [":avg", ["10", "20", "30"], "20"],
      [":avg", ["10", "invalid", "30"], "20"],
      [":avg", [], "0"],
      [":avg(2)", [10, 20, 25], "18.33"],

      // :getIds - flatten the given key across all items
      [
        ":getIds(ids)",
        [{ ids: ["id1", "id2"] }, { ids: ["id3"] }],
        ["id1", "id2", "id3"],
      ],
      [":getIds(ids)", [{ other: "value" }], []],

      // :setString - replace every array value, or the value itself if it is not an array
      [":setString(test)", [1, 2, 3], ["test", "test", "test"]],
      [":setString(test)", "single", "test"],
    ])("evaluates %s over %j as %j", (expression, data, expected) => {
      expect(service.queryData(expression, null, null, data)).toEqual(expected);
    });

    it.each([
      [
        "keeps only the items whose nested attribute matches",
        ":filterByObjectAttribute(item, type, A)",
        [
          { item: { type: "A", value: 1 } },
          { item: { type: "B", value: 2 } },
          { item: { type: "A", value: 3 } },
        ],
        [{ item: { type: "A", value: 1 } }, { item: { type: "A", value: 3 } }],
      ],
      [
        "treats a pipe as 'any of these values'",
        ":filterByObjectAttribute(cat, id, M | F)",
        [{ cat: { id: "M" } }, { cat: { id: "F" } }, { cat: { id: "X" } }],
        [{ cat: { id: "M" } }, { cat: { id: "F" } }],
      ],
      [
        "matches nothing when the attribute does not exist",
        ":filterByObjectAttribute(nonexistent, id, value)",
        [{ other: "value" }],
        [],
      ],
    ])(":filterByObjectAttribute %s", (_case, expression, data, expected) => {
      expect(service.queryData(expression, null, null, data)).toEqual(expected);
    });

    describe(":addEntities", () => {
      it("should concatenate cached entities of specified type to input array", async () => {
        const entity1 = TestEntity.create({ name: "Entity 1" });
        const entity2 = TestEntity.create({ name: "Entity 2" });
        const entity3 = TestEntity.create({ name: "Entity 3" });
        mockEntityMapper.addAll([entity1, entity2]);

        await service.cacheRequiredData(
          "TestEntity:toArray",
          new Date(0),
          new Date(),
        );

        const result = service.queryData(
          ":addEntities(TestEntity)",
          null,
          null,
          [entity3],
        );

        expect(result.length).toBe(3);
        expect(result[0].getId()).toBe(entity3.getId());
        expect(result[1].getId()).toBe(entity1.getId());
        expect(result[2].getId()).toBe(entity2.getId());
      });

      it("should work with empty input array", async () => {
        const entity1 = TestEntity.create({ name: "Entity 1" });
        mockEntityMapper.add(entity1);

        await service.cacheRequiredData(
          "TestEntity:toArray",
          new Date(0),
          new Date(),
        );

        const result = service.queryData(
          ":addEntities(TestEntity)",
          null,
          null,
          [],
        );

        expect(result.length).toBe(1);
        expect(result[0].getId()).toBe(entity1.getId());
      });

      it("should return input array when no cached entities exist", async () => {
        const entity1 = TestEntity.create({ name: "Entity 1" });

        // Cache the entity type but with no entities
        await service.cacheRequiredData(
          "TestEntity:toArray",
          new Date(0),
          new Date(),
        );

        const result = service.queryData(
          ":addEntities(TestEntity)",
          null,
          null,
          [entity1],
        );

        expect(result.length).toBe(1);
        expect(result[0].getId()).toBe(entity1.getId());
      });
    });

    describe(":getParticipantsWithAttendance", () => {
      it("should return participants with specified attendance status", () => {
        const event1 = createEvent(new Date(), [
          { child: "child1", status: presentAttendanceStatus },
          { child: "child2", status: absentAttendanceStatus },
          { child: "child3", status: presentAttendanceStatus },
        ]);
        const event2 = createEvent(new Date(), [
          { child: "child1", status: absentAttendanceStatus },
          { child: "child4", status: presentAttendanceStatus },
        ]);

        const result: string[] = service.queryData(
          ":getParticipantsWithAttendance(PRESENT)",
          null,
          null,
          [event1, event2],
        );

        expect(result).toEqual(["child1", "child3", "child4"]);
      });

      it("should filter by ABSENT status", () => {
        const event = createEvent(new Date(), [
          { child: "child1", status: presentAttendanceStatus },
          { child: "child2", status: absentAttendanceStatus },
          { child: "child3", status: absentAttendanceStatus },
        ]);

        const result: string[] = service.queryData(
          ":getParticipantsWithAttendance(ABSENT)",
          null,
          null,
          [event],
        );

        expect(result).toEqual(["child2", "child3"]);
      });

      it("should return empty array when no participants match status", () => {
        const event = createEvent(new Date(), [
          { child: "child1", status: presentAttendanceStatus },
          { child: "child2", status: presentAttendanceStatus },
        ]);

        const result: string[] = service.queryData(
          ":getParticipantsWithAttendance(ABSENT)",
          null,
          null,
          [event],
        );

        expect(result).toEqual([]);
      });

      it("should handle empty event list", () => {
        const result: string[] = service.queryData(
          ":getParticipantsWithAttendance(PRESENT)",
          null,
          null,
          [],
        );

        expect(result).toEqual([]);
      });
    });

    describe(":getAttendanceReport", () => {
      it("should aggregate attendance by participant", () => {
        const attendances: AttendanceInfo[] = [
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p2",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
        ];

        const report: AttendanceReport[] = service.queryData(
          ":getAttendanceReport",
          null,
          null,
          attendances,
        );

        expect(report.length).toBe(2);
        const p1Report = report.find((r) => r.participant === "p1");
        expect(p1Report.total).toBe(2);
        expect(p1Report.present).toBe(2);
        expect(p1Report.percentage).toBe("1.00");
      });

      it("should count present vs total attendance correctly", () => {
        const attendances: AttendanceInfo[] = [
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p1",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
        ];

        const report: AttendanceReport[] = service.queryData(
          ":getAttendanceReport",
          null,
          null,
          attendances,
        );

        expect(report[0].total).toBe(2);
        expect(report[0].present).toBe(1);
        expect(report[0].percentage).toBe("0.50");
      });

      it("should exclude IGNORE status from total count", () => {
        const attendances: AttendanceInfo[] = [
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p1",
            status: {
              status: ignoreAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
        ];

        const report: AttendanceReport[] = service.queryData(
          ":getAttendanceReport",
          null,
          null,
          attendances,
        );

        expect(report[0].total).toBe(1);
        expect(report[0].present).toBe(1);
      });

      it("should create detailedStatus counts by status ID", () => {
        const attendances: AttendanceInfo[] = [
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
          {
            participant: "p1",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as AttendanceItem,
          },
        ];

        const report: AttendanceReport[] = service.queryData(
          ":getAttendanceReport",
          null,
          null,
          attendances,
        );

        expect(report[0].detailedStatus[presentAttendanceStatus.id]).toBe(2);
        expect(report[0].detailedStatus[absentAttendanceStatus.id]).toBe(1);
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex queries with multiple operations", () => {
      const data = [
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 },
      ];

      const result = service.queryData("[*value>=20]:count", null, null, data);
      expect(result).toBe(2);
    });

    it("should allow chaining multiple helper functions", () => {
      const data = [1, 2, 2, 3, 3, 3];
      const result = service.queryData(":unique:count", null, null, data);

      expect(result).toBe(3);
    });

    it("should handle null query without throwing error", () => {
      expect(() => service.queryData(null)).not.toThrow();
    });

    it("should work with date parameters in queries", async () => {
      const oldNote = createEvent(moment().subtract(2, "weeks").toDate());
      const recentNote = createEvent(moment().subtract(2, "days").toDate());
      mockAttendanceService.getEventsOnDate.mockResolvedValue([
        oldNote,
        recentNote,
      ]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("TestEventEntity", from, to);

      const result = service.queryData(
        "TestEventEntity:toArray[* date >= ? & date < ?]",
        from,
        to,
      );

      expect(result.length).toBe(1);
      expect(result[0].date.getTime()).toBeGreaterThanOrEqual(from.getTime());
    });
  });

  it("should select currently active records with :filterActive", () => {
    const archived = new TestEntity();
    archived.inactive = true;
    const active = new TestEntity();

    const pastRelation = new ChildSchoolRelation();
    pastRelation.start = moment().subtract(1, "year").toDate();
    pastRelation.end = moment().subtract(1, "day").toDate();
    const currentRelation = new ChildSchoolRelation();
    currentRelation.start = moment().subtract(1, "year").toDate();
    const archivedCurrentRelation = new ChildSchoolRelation();
    archivedCurrentRelation.start = moment().subtract(1, "year").toDate();
    archivedCurrentRelation.inactive = true;

    const data = [
      archived,
      active,
      pastRelation,
      currentRelation,
      archivedCurrentRelation,
    ];

    expect(service.queryData(":filterActive", null, null, data)).toEqual([
      active,
      currentRelation,
    ]);
    expect(service.queryData(":filterInactive", null, null, data)).toEqual([
      archived,
      pastRelation,
      archivedCurrentRelation,
    ]);
  });

  // Helper functions
  function createEvent(
    date: Date,
    children: {
      child: string;
      status: AttendanceStatusType;
    }[] = [],
  ): TestEventEntity {
    const event = TestEventEntity.create({ date });
    event.attendance = children.map(({ child, status }) => {
      const item = new AttendanceItem();
      item.participant = child;
      item.status = status;
      return item;
    });
    return event;
  }
});
