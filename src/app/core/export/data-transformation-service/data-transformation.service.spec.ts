import { TestBed, waitForAsync } from "@angular/core/testing";

import { DataTransformationService } from "./data-transformation.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Database } from "../../database/database";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ExportColumnConfig } from "./export-column-config";
import { defaultAttendanceStatusTypes } from "../../config/default-config/default-attendance-status-types";
import moment from "moment";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";

describe("DataTransformationService", () => {
  let service: DataTransformationService;
  let entityMapper: EntityMapperService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });

    service = TestBed.inject<DataTransformationService>(
      DataTransformationService,
    );
    entityMapper = TestBed.inject(EntityMapperService);
  }));

  afterEach(() => TestBed.inject(Database).destroy());

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
    const school1 = await createSchoolInDB("School with student", [child1]);
    const school2 = await createSchoolInDB("School without student", []);
    const school3 = await createSchoolInDB("School with multiple students", [
      child1,
      child2,
    ]);

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
    expect(result1).toEqual([
      { school_name: "School with student", child_name: "John" },
      { school_name: "School without student", child_name: [] },
      {
        school_name: "School with multiple students",
        child_name: jasmine.arrayWithExactContents(["Jane", "John"]),
      },
    ]);
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
        query: ".children:toEntities(Child)",
        subQueries: [{ label: "participant", query: ".name" }],
      },
    ];
    const result1 = await service.transformData([noteA, noteB], exportConfig);

    expect(result1).toEqual([
      { note: "A", participant: "John" },
      { note: "A", participant: "Jane" },
      { note: "B", participant: "John" },
      { note: "B", participant: "Jack" },
    ]);
  });

  it("should handle cases where related entity is queried on an empty result set", async () => {
    const emptyActivity = await createActivityInDB("empty activity", [], []);

    const exportConfig: ExportColumnConfig[] = [
      { label: "activity", query: ".title" },
      {
        query: ".linkedGroups:toEntities(School)",
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
    const results = await service.transformData([emptyActivity], exportConfig);
    const resultRow = results[0];
    expect(resultRow["activity"]).toBe(emptyActivity.title);
    expect(resultRow["school_name"]).toEqual([]);
    expect(resultRow["related_child"]).toEqual([]);
  });

  it("should export attendance status for each note participant", async () => {
    const child1 = await createChildInDB("present kid");
    const child2 = await createChildInDB("absent kid");
    const child3 = await createChildInDB("unknown kid");
    const note = await createNoteInDB(
      "Note 1",
      [child1, child2, child3],
      ["PRESENT", "ABSENT"],
    );

    const exportConfig: ExportColumnConfig[] = [
      { label: "note", query: ".subject" },
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

    const result = await service.transformData([note], exportConfig);

    expect(result).toEqual([
      { note: "Note 1", participant: "present kid", status: "PRESENT" },
      { note: "Note 1", participant: "absent kid", status: "ABSENT" },
      { note: "Note 1", participant: "unknown kid", status: "" },
    ]);
  });

  it("should not omit rows where the subQueries are run on an empty array", async () => {
    const childWithoutSchool = await createChildInDB("child without school");
    const childWithSchool = await createChildInDB("child with school");
    const school = await createSchoolInDB("test school", [childWithSchool]);
    const note = await createNoteInDB(
      "Note",
      [childWithoutSchool, childWithSchool],
      ["PRESENT", "ABSENT"],
    );
    note.schools = [school.getId()];
    await entityMapper.save(note);

    const exportConfig: ExportColumnConfig[] = [
      {
        query: ":getAttendanceArray(true)",
        subQueries: [
          {
            label: "participant",
            query: ".participant:toEntities(Child).name",
          },
          {
            query: ".school:toEntities(School)",
            subQueries: [
              { label: "Name", query: "name" },
              { label: "school_id", query: "entityId" },
            ],
          },
        ],
      },
    ];

    const result = await service.transformData([note], exportConfig);

    expect(result).toEqual([
      { participant: "child without school", Name: [], school_id: [] },
      {
        participant: "child with school",
        Name: school.name,
        school_id: school.getId(),
      },
    ]);
  });

  it("should use first level queries to fetch data if no data is provided", async () => {
    const child = await createChildInDB("some child");
    await createNoteInDB("school", [child], ["PRESENT"]);
    await createNoteInDB("school", [child], ["ABSENT"]);
    await createNoteInDB("coaching", [child], ["PRESENT"]);
    const exportConfig: ExportColumnConfig[] = [
      {
        query: `${Note.ENTITY_TYPE}:toArray[* subject = school]:getAttendanceArray:getAttendanceReport`,
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
        query: `${Note.ENTITY_TYPE}:toArray[* subject = coaching]:getAttendanceArray:getAttendanceReport`,
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

    let result = await service.queryAndTransformData(
      [
        {
          query: `${Note.ENTITY_TYPE}:toArray`,
          subQueries: [{ query: "subject" }],
        },
      ],
      moment().subtract(5, "days").toDate(),
    );

    expect(result.map((x) => x.subject)).toEqual(["yesterday", "today"]);

    const query = [
      { query: "name" },
      {
        query: ":getRelated(Note, children)[* date > ?]",
        subQueries: [{ query: "subject" }],
      },
    ];
    result = await service.transformData(
      [child],
      query,
      moment().subtract(5, "days").toDate(),
    );

    expect(result).toEqual([
      { name: "Child", subject: "yesterday" },
      { name: "Child", subject: "today" },
    ]);

    query[1].query = ":getRelated(Note, children)[* date > ? & date <= ?]";
    result = await service.transformData(
      [child],
      query,
      moment().subtract(1, "weeks").subtract(1, "day").toDate(),
      moment().subtract(1, "day").toDate(),
    );

    expect(result).toEqual([
      { name: "Child", subject: "one week ago" },
      { name: "Child", subject: "yesterday" },
    ]);
  });

  it("should work when using the count function", async () => {
    await createNoteInDB("first", [new Child(), new Child()]);
    await createNoteInDB("second", [new Child()]);

    const result = await service.queryAndTransformData([
      {
        query: `${Note.ENTITY_TYPE}:toArray`,
        subQueries: [
          { query: "subject" },
          { query: ".children:count", label: "Children" },
        ],
      },
    ]);

    expect(result).toEqual(
      jasmine.arrayWithExactContents([
        { subject: "first", Children: 2 },
        { subject: "second", Children: 1 },
      ]),
    );
  });

  it("should allow to group results", async () => {
    await createSchoolInDB("sameName");
    await createSchoolInDB("sameName");
    await createSchoolInDB("otherName");

    const result = await service.queryAndTransformData([
      {
        query: `${School.ENTITY_TYPE}:toArray`,
        groupBy: { label: "Name", property: "name" },
        subQueries: [{ query: ":count", label: "Amount" }],
      },
    ]);

    expect(result).toEqual(
      jasmine.arrayWithExactContents([
        { Name: "sameName", Amount: 2 },
        { Name: "otherName", Amount: 1 },
      ]),
    );
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
        query: `${Child.ENTITY_TYPE}:toArray:count`,
        label: "Count",
      },
      {
        query: `${Child.ENTITY_TYPE}:toArray`,
        groupBy: { label: "Group", property: "name" },
        subQueries: [{ query: ":count", label: "Count" }],
      },
    ]);

    expect(result).toEqual(
      jasmine.arrayWithExactContents([
        { Group: "Total", Count: 3 },
        { Group: "A", Count: 2 },
        { Group: "B", Count: 1 },
      ]),
    );
  });

  async function createChildInDB(name: string): Promise<Child> {
    const child = new Child();
    child.name = name;
    await entityMapper.save(child);
    return child;
  }

  async function createNoteInDB(
    subject: string,
    children: Child[] = [],
    attendanceStatus: string[] = [],
  ): Promise<Note> {
    const note = new Note();
    note.subject = subject;
    note.date = new Date();
    note.children = children.map((child) => child.getId());

    for (let i = 0; i < attendanceStatus.length; i++) {
      note.getAttendance(note.children[i]).status =
        defaultAttendanceStatusTypes.find((s) => s.id === attendanceStatus[i]);
    }
    await entityMapper.save(note);
    return note;
  }

  async function createSchoolInDB(
    schoolName: string,
    students: Child[] = [],
  ): Promise<School> {
    const school = new School();
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

  async function createActivityInDB(
    activityTitle: string,
    participants: Child[] = [],
    groups: School[] = [],
  ): Promise<RecurringActivity> {
    const activity = new RecurringActivity();
    activity.title = activityTitle;
    activity.participants = participants.map((p) => p.getId());
    activity.linkedGroups = groups.map((g) => g.getId());
    await entityMapper.save(activity);

    return activity;
  }
});
