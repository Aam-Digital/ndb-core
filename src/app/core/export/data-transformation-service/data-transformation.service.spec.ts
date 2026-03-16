import { TestBed } from "@angular/core/testing";

import { DataTransformationService } from "./data-transformation.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Note } from "../../../child-dev-project/notes/model/note";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ExportColumnConfig } from "./export-column-config";
import { defaultAttendanceStatusTypes } from "../../config/default-config/default-attendance-status-types";
import moment from "moment";
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Entity } from "../../entity/model/entity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { TestEventEntity } from "../../../utils/test-utils/TestEventEntity";
import { AttendanceService } from "#src/app/features/attendance/attendance.service";
import { EventWithAttendance } from "#src/app/features/attendance/model/event-with-attendance";

describe("DataTransformationService", () => {
  let service: DataTransformationService;
  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });

    service = TestBed.inject<DataTransformationService>(
      DataTransformationService,
    );
    entityMapper = TestBed.inject(EntityMapperService);

    const attendanceService = TestBed.inject(AttendanceService);
    vi.spyOn(attendanceService, "wrapEventEntity").mockImplementation(
      (entity: Entity) => {
        return new EventWithAttendance(
          entity,
          "attendance",
          "date",
          "relatesTo",
          "authors",
          undefined,
        );
      },
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should export only properties mentioned in config", async () => {
    const testObject1 = {
      name: "foo",
      age: 12,
    };
    const testObject2 = {
      name: "bar",
      age: 15,
      extra: true,
    };

    const result = await service.transformData(
      [testObject1, testObject2],
      [{ label: "test_name", query: ".name" }],
    );

    expect(result).toEqual([{ test_name: "foo" }, { test_name: "bar" }]);
  });

  it("should load fields from related entity for joint export", async () => {
    const child1 = await createChildInDB("John");
    const child2 = await createChildInDB("Jane");
    const school1 = await createTestEntityInDB("School with student", [child1]);
    const school2 = await createTestEntityInDB("School without student", []);
    const school3 = await createTestEntityInDB(
      "School with multiple students",
      [child1, child2],
    );

    const query1 =
      ":getRelated(ChildSchoolRelation, schoolId).childId:toEntities(Child).name";
    const exportConfig: ExportColumnConfig[] = [
      { label: "school_name", query: ".name" },
      { label: "child_name", query: query1 },
    ];
    const result1 = await service.transformData(
      [school1, school2, school3],
      exportConfig,
    );
    expect(result1).toHaveLength(3);
    expect(result1[0]).toEqual({
      school_name: "School with student",
      child_name: "John",
    });
    expect(result1[1]).toEqual({
      school_name: "School without student",
      child_name: [],
    });
    expect(result1[2]).toEqual(
      expect.objectContaining({
        school_name: "School with multiple students",
      }),
    );
    expect(result1[2].child_name).toHaveLength(2);
    expect(result1[2].child_name).toEqual(
      expect.arrayContaining(["Jane", "John"]),
    );
  });

  it("should roll out export to one row for each related entity", async () => {
    const child1 = await createChildInDB("John");
    const child2 = await createChildInDB("Jane");
    const child3 = await createChildInDB("Jack");
    const noteA = await createNoteInDB("A", [child1, child2]);
    const noteB = await createNoteInDB("B", [child1, child3]);

    const exportConfig: ExportColumnConfig[] = [
      { label: "note", query: ".subject" },
      {
        query: ".children",
        subQueries: [{ label: "participant", query: "." }],
      },
    ];
    const result1 = await service.transformData([noteA, noteB], exportConfig);

    expect(result1).toEqual([
      { note: "A", participant: child1.getId() },
      { note: "A", participant: child2.getId() },
      { note: "B", participant: child1.getId() },
      { note: "B", participant: child3.getId() },
    ]);
  });

  it("should handle cases where related entity is queried on an empty result set", async () => {
    const emptyEntity = new TestEntity();
    emptyEntity.name = "empty activity";
    emptyEntity.refMixed = [];
    await entityMapper.save(emptyEntity);

    const exportConfig: ExportColumnConfig[] = [
      { label: "activity", query: ".name" },
      {
        query: ".refMixed:toEntities(TestEntity)",
        subQueries: [
          { label: "school_name", query: "name" },
          {
            label: "related_child",
            query:
              ":getRelated(ChildSchoolRelation, schoolId)[*isActive=true].childId",
          },
        ],
      },
    ];
    const results = await service.transformData([emptyEntity], exportConfig);
    const resultRow = results[0];
    expect(resultRow["activity"]).toBe(emptyEntity.name);
    expect(resultRow["school_name"]).toEqual([]);
    expect(resultRow["related_child"]).toEqual([]);
  });

  it("should export attendance status for each event participant", async () => {
    const child1 = await createChildInDB("present kid");
    const child2 = await createChildInDB("absent kid");
    const event = await createEventInDB(
      "Event 1",
      [child1, child2],
      ["PRESENT", "ABSENT"],
    );

    const exportConfig: ExportColumnConfig[] = [
      { label: "event", query: ".title" },
      {
        query: ":getAttendanceArray",
        subQueries: [
          {
            label: "participant",
            query: ".participant:toEntities(Child).name",
          },
          {
            label: "status",
            query: ".status._status.id",
          },
        ],
      },
    ];

    const result = await service.transformData([event], exportConfig);

    expect(result).toEqual([
      { event: "Event 1", participant: "present kid", status: "PRESENT" },
      { event: "Event 1", participant: "absent kid", status: "ABSENT" },
    ]);
  });

  it("should not omit rows where the subQueries are run on an empty array", async () => {
    const childWithoutSchool = await createChildInDB("child without school");
    const childWithSchool = await createChildInDB("child with school");
    const school = await createTestEntityInDB("test school", [childWithSchool]);
    const event = await createEventInDB(
      "Event",
      [childWithoutSchool, childWithSchool],
      ["PRESENT", "ABSENT"],
    );
    (event as any).schools = [school.getId()];
    await entityMapper.save(event);

    const exportConfig: ExportColumnConfig[] = [
      {
        query: ":getAttendanceArray(true)",
        subQueries: [
          {
            label: "participant",
            query: ".participant",
          },
          {
            query: ".school:toEntities(TestEntity)",
            subQueries: [
              { label: "Name", query: "name" },
              { label: "school_id", query: "entityId" },
            ],
          },
        ],
      },
    ];

    const result = await service.transformData([event], exportConfig);

    expect(result).toEqual([
      {
        participant: childWithoutSchool.getId(),
        Name: [],
        school_id: [],
      },
      {
        participant: childWithSchool.getId(),
        Name: school.name,
        school_id: school.getId(true),
      },
    ]);
  });

  it("should use first level queries to fetch data if no data is provided", async () => {
    const child = await createChildInDB("some child");
    await createEventInDB("school", [child], ["PRESENT"]);
    await createEventInDB("school", [child], ["ABSENT"]);
    await createEventInDB("coaching", [child], ["PRESENT"]);

    const exportConfig: ExportColumnConfig[] = [
      {
        query: `${TestEventEntity.ENTITY_TYPE}:toArray[* title = school]:getAttendanceArray:getAttendanceReport`,
        subQueries: [
          {
            label: "Name",
            query: `.participant:toEntities(Child).name`,
          },
          {
            label: "Participation",
            query: `percentage`,
          },
        ],
      },
      {
        query: `${TestEventEntity.ENTITY_TYPE}:toArray[* title = coaching]:getAttendanceArray:getAttendanceReport`,
        subQueries: [
          {
            label: "Name",
            query: `.participant:toEntities(Child).name`,
          },
          {
            label: "Participation",
            query: `percentage`,
          },
        ],
      },
    ];
    const result = await service.queryAndTransformData(exportConfig);

    expect(result).toEqual([
      { Name: "some child", Participation: "0.50" },
      { Name: "some child", Participation: "1.00" },
    ]);
  });

  it("should support time spans for data export", async () => {
    const child = await createChildInDB("Child");
    const oneWeekAgoNote = await createNoteInDB("one week ago", [child]);
    oneWeekAgoNote.date = moment().subtract(1, "week").toDate();
    await entityMapper.save(oneWeekAgoNote);
    const yesterdayNote = await createNoteInDB("yesterday", [child]);
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    await entityMapper.save(yesterdayNote);
    const todayNote = await createNoteInDB("today", [child]);
    todayNote.date = new Date();
    await entityMapper.save(todayNote);

    const childrenService = TestBed.inject(ChildrenService);
    const getNotesInTimespan = vi.spyOn(childrenService, "getNotesInTimespan");

    getNotesInTimespan.mockResolvedValue([yesterdayNote, todayNote]);
    const startDate = moment().subtract(5, "days").toDate();
    let result = await service.queryAndTransformData(
      [
        {
          query: `${Note.ENTITY_TYPE}:toArray`,
          subQueries: [{ query: "subject" }],
        },
      ],
      startDate,
    );

    expect(result.map((x) => x.subject)).toEqual(["yesterday", "today"]);
    expect(getNotesInTimespan).toHaveBeenCalledWith(
      startDate,
      expect.anything(),
    );

    getNotesInTimespan.mockClear();
    const query = [
      { query: "name" },
      {
        query: ":getRelated(Note, children)[* date > ?]",
        subQueries: [{ query: "subject" }],
      },
    ];
    result = await service.transformData([child], query, startDate);

    expect(result).toEqual([
      { name: "Child", subject: "yesterday" },
      { name: "Child", subject: "today" },
    ]);
    // TODO for some reason this spy is sometimes (inexplicably) not called:
    // expect(getNotesInTimespan).toHaveBeenCalledWith(startDate, jasmine.anything() );

    getNotesInTimespan.mockClear();
    getNotesInTimespan.mockResolvedValue([oneWeekAgoNote, yesterdayNote]);
    const startDate2 = moment()
      .subtract(1, "weeks")
      .subtract(1, "day")
      .toDate();
    const endDate2 = moment().subtract(1, "day").toDate();
    query[1].query = ":getRelated(Note, children)[* date > ? & date <= ?]";
    result = await service.transformData([child], query, startDate2, endDate2);

    expect(result).toEqual([
      { name: "Child", subject: "one week ago" },
      { name: "Child", subject: "yesterday" },
    ]);
    expect(getNotesInTimespan).toHaveBeenCalledWith(startDate2, endDate2);
  });

  it("should work when using the count function", async () => {
    const e1 = TestEventEntity.create({ title: "first" });
    e1.attendance = [new AttendanceItem(), new AttendanceItem()];
    await entityMapper.save(e1);
    const e2 = TestEventEntity.create({ title: "second" });
    e2.attendance = [new AttendanceItem()];
    await entityMapper.save(e2);

    const result = await service.queryAndTransformData([
      {
        query: `TestEventEntity:toArray`,
        subQueries: [
          { query: "title" },
          { query: ".attendance:count", label: "Participants" },
        ],
      },
    ]);
    expect(result).toEqualArrayWithExactContents([
      { title: "first", Participants: 2 },
      { title: "second", Participants: 1 },
    ]);
  });

  it("should allow to group results", async () => {
    await createTestEntityInDB("sameName");
    await createTestEntityInDB("sameName");
    await createTestEntityInDB("otherName");

    const result = await service.queryAndTransformData([
      {
        query: `${TestEntity.ENTITY_TYPE}:toArray`,
        groupBy: { label: "Name", property: "name" },
        subQueries: [{ query: ":count", label: "Amount" }],
      },
    ]);
    expect(result).toEqualArrayWithExactContents([
      { Name: "sameName", Amount: 2 },
      { Name: "otherName", Amount: 1 },
    ]);
  });

  it("should allow results for top level (un-nested) queries", async () => {
    await createChildInDB("A");
    await createChildInDB("A");
    await createChildInDB("B");

    const result = await service.queryAndTransformData([
      {
        query: `:setString(Total)`,
        label: "Group",
      },
      {
        query: `Child:toArray:count`,
        label: "Count",
      },
      {
        query: `Child:toArray`,
        groupBy: { label: "Group", property: "name" },
        subQueries: [{ query: ":count", label: "Count" }],
      },
    ]);
    expect(result).toEqualArrayWithExactContents([
      { Group: "Total", Count: 3 },
      { Group: "A", Count: 2 },
      { Group: "B", Count: 1 },
    ]);
  });

  async function createChildInDB(name: string): Promise<Entity> {
    const child = createEntityOfType("Child");
    child.name = name;
    await entityMapper.save(child);
    return child;
  }

  async function createNoteInDB(
    subject: string,
    children: Entity[] = [],
    attendanceStatus: string[] = [],
  ): Promise<Note> {
    const note = new Note();
    note.subject = subject;
    note.date = new Date();
    note.children = children.map((child) => child.getId());

    for (let i = 0; i < attendanceStatus.length; i++) {
      const attendance = new AttendanceItem();
      attendance.participant = note.children[i];
      attendance.status = defaultAttendanceStatusTypes.find(
        (s) => s.id === attendanceStatus[i],
      );
      note.childrenAttendance.push(attendance);
    }
    await entityMapper.save(note);
    return note;
  }

  async function createEventInDB(
    title: string,
    participants: Entity[] = [],
    attendanceStatus: string[] = [],
  ): Promise<TestEventEntity> {
    const event = TestEventEntity.create({ title, date: new Date() });

    for (let i = 0; i < attendanceStatus.length; i++) {
      const attendance = new AttendanceItem();
      attendance.participant = participants[i].getId();
      attendance.status = defaultAttendanceStatusTypes.find(
        (s) => s.id === attendanceStatus[i],
      );
      event.attendance.push(attendance);
    }

    await entityMapper.save(event);
    return event;
  }

  async function createTestEntityInDB(
    schoolName: string,
    students: Entity[] = [],
  ): Promise<TestEntity> {
    const school = new TestEntity();
    school.name = schoolName;
    await entityMapper.save(school);

    for (const child of students) {
      const childSchoolRel = new ChildSchoolRelation();
      childSchoolRel.childId = child.getId();
      childSchoolRel.schoolId = school.getId();
      childSchoolRel.start = new Date();
      await entityMapper.save(childSchoolRel);
    }

    return school;
  }
});
