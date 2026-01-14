import { TestBed } from "@angular/core/testing";
import moment from "moment";

import {
  QueryService,
  AttendanceInfo,
  AttendanceReport,
} from "./query.service";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { Note } from "../../child-dev-project/notes/model/note";
import { EventAttendance } from "../../child-dev-project/attendance/model/event-attendance";
import { AttendanceStatusType } from "../../child-dev-project/attendance/model/attendance-status";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "../../child-dev-project/attendance/attendance.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { DefaultDatatype } from "../entity/default-datatype/default.datatype";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { defaultAttendanceStatusTypes } from "../config/default-config/default-attendance-status-types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";

// Note that we used to have more realistic tests here using the DatabaseTestingModule.
// These have been replace with more focused, isolated unit tests using mocked services.
// refer back to previous git versions for the old tests: https://github.com/Aam-Digital/ndb-core/blob/7b889418809c1f9d46cbe959b2bfb90e7534fce6/src/app/core/export/query.service.spec.ts
// We may re-implement those as full e2e tests in the future if needed.

describe("QueryService", () => {
  let service: QueryService;
  let mockEntityMapper: MockEntityMapperService;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
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
    mockChildrenService = jasmine.createSpyObj("ChildrenService", [
      "getNotesInTimespan",
    ]);
    mockChildrenService.getNotesInTimespan.and.returnValue(Promise.resolve([]));

    mockAttendanceService = jasmine.createSpyObj("AttendanceService", [
      "getEventsOnDate",
    ]);
    mockAttendanceService.getEventsOnDate.and.returnValue(Promise.resolve([]));

    mockEntityRegistry = new EntityRegistry();
    mockEntityRegistry.add(TestEntity.ENTITY_TYPE, TestEntity);
    mockEntityRegistry.add("Note", Note);
    mockEntityRegistry.add("EventNote", EventNote);
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

  it("should be created", () => {
    expect(service).toBeTruthy();
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
      const note = createNote(new Date());
      mockChildrenService.getNotesInTimespan.and.resolveTo([note]);

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

    it("should load EventNote entities using dataFunction", async () => {
      const event = createNote(new Date());
      mockAttendanceService.getEventsOnDate.and.resolveTo([event]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("EventNote:toArray", from, to);

      expect(mockAttendanceService.getEventsOnDate).toHaveBeenCalledWith(
        from,
        to,
      );
      const result = service.queryData("EventNote:toArray");
      expect(result.length).toBe(1);
    });

    it("should not reload entities when requested range is within cached range", async () => {
      mockChildrenService.getNotesInTimespan.and.resolveTo([]);

      const from = moment().subtract(2, "weeks").toDate();
      const to = new Date();
      await service.cacheRequiredData("Note:toArray", from, to);
      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(1);

      const narrowFrom = moment().subtract(1, "week").toDate();
      await service.cacheRequiredData("Note:toArray", narrowFrom, to);

      expect(mockChildrenService.getNotesInTimespan).toHaveBeenCalledTimes(1);
    });

    it("should reload entities when requested range extends beyond cached range", async () => {
      mockChildrenService.getNotesInTimespan.and.resolveTo([]);

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
    describe(":toArray", () => {
      it("should convert object with values to array", () => {
        const data = { a: 1, b: 2, c: 3 };
        const result = service.queryData(":toArray", null, null, data);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([1, 2, 3]);
      });

      it("should handle empty objects", () => {
        const result = service.queryData(":toArray", null, null, {});

        expect(result).toEqual([]);
      });
    });

    describe(":unique", () => {
      it("should remove duplicate values from array", () => {
        const data = [1, 2, 2, 3, 3, 3, 4];
        const result = service.queryData(":unique", null, null, data);

        expect(result).toEqual([1, 2, 3, 4]);
      });

      it("should handle empty arrays", () => {
        const result = service.queryData(":unique", null, null, []);

        expect(result).toEqual([]);
      });
    });

    describe(":count", () => {
      it("should return length of array", () => {
        const data = [1, 2, 3, 4, 5];
        const result = service.queryData(":count", null, null, data);

        expect(result).toBe(5);
      });

      it("should return 0 for empty array", () => {
        const result = service.queryData(":count", null, null, []);

        expect(result).toBe(0);
      });
    });

    describe(":sum", () => {
      it("should sum numeric values in array", () => {
        const data = [1, 2, 3, 4];
        const result = service.queryData(":sum", null, null, data);

        expect(result).toBe(10);
      });

      it("should handle string representations of numbers", () => {
        const data = ["1", "2", "3"];
        const result = service.queryData(":sum", null, null, data);

        expect(result).toBe(6);
      });

      it("should ignore non-numeric values", () => {
        const data = ["1", "invalid", "3", null, undefined];
        const result = service.queryData(":sum", null, null, data);

        expect(result).toBe(4);
      });

      it("should return 0 for empty array", () => {
        const result = service.queryData(":sum", null, null, []);

        expect(result).toBe(0);
      });
    });

    describe(":avg", () => {
      it("should calculate average of numeric array", () => {
        const data = [10, 20, 30];
        const result = service.queryData(":avg", null, null, data);

        expect(result).toBe("20");
      });

      it("should handle string representations of numbers", () => {
        const data = ["10", "20", "30"];
        const result = service.queryData(":avg", null, null, data);

        expect(result).toBe("20");
      });

      it("should skip non-numeric values in calculation", () => {
        const data = ["10", "invalid", "30"];
        const result = service.queryData(":avg", null, null, data);

        expect(result).toBe("20");
      });

      it("should return 0 for empty array", () => {
        const result = service.queryData(":avg", null, null, []);

        expect(result).toBe("0");
      });

      it("should respect decimals parameter for rounding", () => {
        const data = [10, 20, 25];
        const result = service.queryData(":avg(2)", null, null, data);

        expect(result).toBe("18.33");
      });
    });

    describe(":filterByObjectAttribute", () => {
      it("should filter objects by nested attribute value", () => {
        const data = [
          { item: { type: "A", value: 1 } },
          { item: { type: "B", value: 2 } },
          { item: { type: "A", value: 3 } },
        ];
        const result = service.queryData(
          ":filterByObjectAttribute(item, type, A)",
          null,
          null,
          data,
        );

        expect(result.length).toBe(2);
        expect(result[0].item.type).toBe("A");
        expect(result[1].item.type).toBe("A");
      });

      it("should handle multiple filter values separated by pipe", () => {
        const data = [
          { cat: { id: "M" } },
          { cat: { id: "F" } },
          { cat: { id: "X" } },
        ];
        const result = service.queryData(
          ":filterByObjectAttribute(cat, id, M | F)",
          null,
          null,
          data,
        );

        expect(result.length).toBe(2);
      });

      it("should return empty array when attribute doesn't exist", () => {
        const data = [{ other: "value" }];
        const result = service.queryData(
          ":filterByObjectAttribute(nonexistent, id, value)",
          null,
          null,
          data,
        );

        expect(result).toEqual([]);
      });
    });

    describe(":getIds", () => {
      it("should extract IDs from array of objects by key", () => {
        const data = [{ ids: ["id1", "id2"] }, { ids: ["id3"] }];
        const result = service.queryData(":getIds(ids)", null, null, data);

        expect(result).toEqual(["id1", "id2", "id3"]);
      });

      it("should handle objects without the specified key", () => {
        const data = [{ other: "value" }];
        const result = service.queryData(":getIds(ids)", null, null, data);

        expect(result).toEqual([]);
      });
    });

    describe(":setString", () => {
      it("should replace all array values with specified string", () => {
        const data = [1, 2, 3];
        const result = service.queryData(":setString(test)", null, null, data);

        expect(result).toEqual(["test", "test", "test"]);
      });

      it("should return string directly when input is not array", () => {
        const data = "single";
        const result = service.queryData(":setString(test)", null, null, data);

        expect(result).toBe("test");
      });
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
        const event1 = createNote(new Date(), [
          { child: "child1", status: presentAttendanceStatus },
          { child: "child2", status: absentAttendanceStatus },
          { child: "child3", status: presentAttendanceStatus },
        ]);
        const event2 = createNote(new Date(), [
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
        const event = createNote(new Date(), [
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
        const event = createNote(new Date(), [
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
            } as EventAttendance,
          },
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as EventAttendance,
          },
          {
            participant: "p2",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as EventAttendance,
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
            } as EventAttendance,
          },
          {
            participant: "p1",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as EventAttendance,
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
            } as EventAttendance,
          },
          {
            participant: "p1",
            status: {
              status: ignoreAttendanceStatus,
              remarks: "",
            } as EventAttendance,
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
            } as EventAttendance,
          },
          {
            participant: "p1",
            status: {
              status: presentAttendanceStatus,
              remarks: "",
            } as EventAttendance,
          },
          {
            participant: "p1",
            status: {
              status: absentAttendanceStatus,
              remarks: "",
            } as EventAttendance,
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
      const oldNote = createNote(moment().subtract(2, "weeks").toDate());
      const recentNote = createNote(moment().subtract(2, "days").toDate());
      mockAttendanceService.getEventsOnDate.and.resolveTo([
        oldNote,
        recentNote,
      ]);

      const from = moment().subtract(1, "week").toDate();
      const to = new Date();
      await service.cacheRequiredData("EventNote", from, to);

      const result = service.queryData(
        "EventNote:toArray[* date >= ? & date < ?]",
        from,
        to,
      );

      expect(result.length).toBe(1);
      expect(result[0].date.getTime()).toBeGreaterThanOrEqual(from.getTime());
    });
  });

  // Helper functions
  function createNote(
    date: Date,
    children: { child: string; status: AttendanceStatusType }[] = [],
  ): EventNote {
    const note = new EventNote();
    note.date = date;
    note.children = children.map((c) => c.child);

    children.forEach(({ child, status }) => {
      note.getAttendance(child).status = status;
    });

    return note;
  }
});
