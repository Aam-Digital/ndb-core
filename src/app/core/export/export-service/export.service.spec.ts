import { TestBed } from "@angular/core/testing";

import { ExportService } from "./export.service";
import { ConfigurableEnumValue } from "../../configurable-enum/configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { QueryService } from "../../../features/reporting/query.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { AttendanceService } from "../../../child-dev-project/attendance/attendance.service";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ExportColumnConfig } from "./export-column-config";
import { defaultAttendanceStatusTypes } from "../../config/default-config/default-attendance-status-types";
import moment from "moment";

describe("ExportService", () => {
  let service: ExportService;
  let db: PouchDatabase;
  let entityMapper: EntityMapperService;

  beforeEach(() => {
    db = PouchDatabase.createWithData();

    TestBed.configureTestingModule({
      providers: [
        ExportService,
        QueryService,
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        AttendanceService,
        DatabaseIndexingService,
        { provide: Database, useValue: db },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
      ],
    });

    service = TestBed.inject<ExportService>(ExportService);
    entityMapper = TestBed.inject(EntityMapperService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should export to json array", () => {
    class TestClass {
      propertyOne;
      propertyTwo;
    }
    const test = new TestClass();
    test.propertyOne = "Hello";
    test.propertyTwo = "World";

    const result = service.createJson([test, test]);

    expect(result).toEqual(
      '[{"propertyOne":"Hello","propertyTwo":"World"},{"propertyOne":"Hello","propertyTwo":"World"}]'
    );
  });

  it("should contain a column for every property", async () => {
    const docs = [
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", other: 2 },
    ];

    const csvExport = await service.createCsv(docs);

    const rows = csvExport.split(ExportService.SEPARATOR_ROW);
    expect(rows).toHaveSize(2 + 1); // includes 1 header line
    expect(rows[0].split(ExportService.SEPARATOR_COL)).toHaveSize(3);
  });

  it("should create a csv string correctly", async () => {
    class TestClass extends Entity {
      propOne;
      propTwo;
    }
    const test = new TestClass();
    test._id = "1";
    test._rev = "2";
    test.propOne = "first";
    test.propTwo = "second";
    const expected =
      '"_id","_rev","propOne","propTwo"' +
      ExportService.SEPARATOR_ROW +
      '"1","2","first","second"';
    const result = await service.createCsv([test]);
    expect(result).toEqual(expected);
  });

  it("should export all properties if no config is provided", async () => {
    const testObject1 = {
      name: "foo",
      age: 12,
    };
    const testObject2 = {
      name: "bar",
      age: 15,
      extra: true,
    };

    const csvResult = await service.createCsv([testObject1, testObject2]);

    const resultRows = csvResult.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      '"name","age","extra"',
      '"foo","12",',
      '"bar","15","true"',
    ]);
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

    const csvResult = await service.createCsv(
      [testObject1, testObject2],
      [{ label: "test name", query: ".name" }]
    );

    const resultRows = csvResult.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual(['"test name"', '"foo"', '"bar"']);
  });

  it("should transform object properties to their label for export", async () => {
    const testEnumValue: ConfigurableEnumValue = {
      id: "ID VALUE",
      label: "label value",
    };
    const testDate = "2020-01-30";

    @DatabaseEntity("TestEntity")
    class TestEntity extends Entity {
      @DatabaseField() enumProperty: ConfigurableEnumValue;
      @DatabaseField() dateProperty: Date;
      @DatabaseField() boolProperty: boolean;
    }

    const testEntity = new TestEntity();
    testEntity.enumProperty = testEnumValue;
    testEntity.dateProperty = new Date(testDate);
    testEntity.boolProperty = true;

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(ExportService.SEPARATOR_ROW);
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(ExportService.SEPARATOR_COL);
    expect(columnValues).toHaveSize(3 + 1); // Properties + _id
    expect(columnValues).toContain('"' + testEnumValue.label + '"');
    expect(columnValues).toContain(
      '"' + moment(new Date(testDate)).toISOString(true) + '"'
    );
    expect(columnValues).toContain('"true"');
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
      { label: "school name", query: ".name" },
      { label: "child name", query: query1 },
    ];
    const result1 = await service.createCsv(
      [school1, school2, school3],
      exportConfig
    );
    const resultRows = result1.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      `"${exportConfig[0].label}","${exportConfig[1].label}"`,
      '"School with student","John"',
      '"School without student",""',
      jasmine.stringMatching(
        // order of student names is somehow random "Jane,John" or "John,Jane"
        /"School with multiple students","(Jane,John|John,Jane)"/
      ),
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
    const result1 = await service.createCsv([noteA, noteB], exportConfig);
    const resultRows = result1.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      `"${exportConfig[0].label}","${exportConfig[1].subQueries[0].label}"`,
      '"A","John"',
      '"A","Jane"',
      '"B","John"',
      '"B","Jack"',
    ]);
  });

  it("should export attendance status for each note participant", async () => {
    const child1 = await createChildInDB("present kid");
    const child2 = await createChildInDB("absent kid");
    const child3 = await createChildInDB("unknown kid");
    const note = await createNoteInDB(
      "Note 1",
      [child1, child2, child3],
      ["PRESENT", "ABSENT"]
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

    const result = await service.createCsv([note], exportConfig);

    const resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      `"${exportConfig[0].label}","participant","status"`,
      '"Note 1","present kid","PRESENT"',
      '"Note 1","absent kid","ABSENT"',
      '"Note 1","unknown kid",""',
    ]);
  });

  it("should export a date according to the local format", async () => {
    // Create date at midnight on first of january 2021
    const dateString = "2021-01-01";
    const dateObject = new Date(dateString);
    dateObject.setHours(0, 0, 0);

    const exportData = [
      {
        date: dateObject,
        number: 10,
        string: "someString",
      },
    ];

    const csv = await service.createCsv(exportData);

    const results = csv.split(ExportService.SEPARATOR_ROW);
    // Format: yyyy-mm-ddThh:mm:ss.mmm+hh:mm
    const expectedDateFormat =
      dateString + "T00:00:00.000" + getTimezoneOffset(dateObject);
    expect(results).toEqual([
      '"date","number","string"',
      `"${expectedDateFormat}","10","someString"`,
    ]);
  });

  it("should not omit rows where the subQueries are run on an empty array", async () => {
    const childWithoutSchool = await createChildInDB("child without school");
    const childWithSchool = await createChildInDB("child with school");
    const school = await createSchoolInDB("test school", [childWithSchool]);
    const note = await createNoteInDB(
      "Note",
      [childWithoutSchool, childWithSchool],
      ["PRESENT", "ABSENT"]
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
              { label: "School ID", query: "entityId" },
            ],
          },
        ],
      },
    ];

    const result = await service.createCsv([note], exportConfig);

    const resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      '"participant","Name","School ID"',
      '"child without school","",""',
      `"child with school","${school.name}","${school.getId()}"`,
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
    const result = await service.createCsv(undefined, exportConfig);

    const resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      '"Name","Participation"',
      '"some child","0.50"',
      '"some child","1.00"',
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
    const query = [
      { query: "name" },
      {
        query: ":getRelated(Note, children)[* date > ?]",
        subQueries: [{ query: "subject" }],
      },
    ];

    let result = await service.createCsv(
      undefined,
      [
        {
          query: `${Note.ENTITY_TYPE}:toArray`,
          subQueries: [{ query: "subject" }],
        },
      ],
      moment().subtract(5, "days").toDate()
    );
    let resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual(['"subject"', '"yesterday"', '"today"']);

    result = await service.createCsv(
      [child],
      query,
      moment().subtract(5, "days").toDate()
    );
    resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      '"name","subject"',
      '"Child","yesterday"',
      '"Child","today"',
    ]);

    query[1].query = ":getRelated(Note, children)[* date > ? & date <= ?]";
    result = await service.createCsv(
      [child],
      query,
      moment().subtract(1, "weeks").subtract(1, "day").toDate(),
      moment().subtract(1, "day").toDate()
    );
    resultRows = result.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      '"name","subject"',
      '"Child","one week ago"',
      '"Child","yesterday"',
    ]);
  });

  it("should not use query service if no export config is provided", async () => {
    const data = [{ key: "some" }, { key: "data" }];
    const queryService = TestBed.inject(QueryService);
    spyOn(queryService, "queryData").and.callThrough();

    const result = await service.createCsv(data);

    expect(queryService.queryData).not.toHaveBeenCalled();
    expect(result).toBe(
      `"key"${ExportService.SEPARATOR_ROW}"some"${ExportService.SEPARATOR_ROW}"data"`
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
    attendanceStatus: string[] = []
  ): Promise<Note> {
    const note = new Note();
    note.subject = subject;
    note.date = new Date();
    note.children = children.map((child) => child.getId());

    for (let i = 0; i < attendanceStatus.length; i++) {
      note.getAttendance(
        note.children[i]
      ).status = defaultAttendanceStatusTypes.find(
        (s) => s.id === attendanceStatus[i]
      );
    }
    await entityMapper.save(note);
    return note;
  }

  async function createSchoolInDB(
    schoolName: string,
    students: Child[] = []
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

  /**
   * Returns the timezone offset in hours and minutes.
   * E.g. german date object => "+02:00" or "+01:00" depending on time of the year
   * @param date object for which the offset should be calculated
   */
  function getTimezoneOffset(date: Date): string {
    // from https://usefulangle.com/post/30/javascript-get-date-time-with-offset-hours-minutes
    const offset = date.getTimezoneOffset();

    const offsetHrs = parseInt(Math.abs(offset / 60).toString(), 10);
    const offsetMin = Math.abs(offset % 60);

    const hrsString = offsetHrs > 10 ? offsetHrs.toString() : "0" + offsetHrs;
    const minString = offsetMin > 10 ? offsetMin.toString() : "0" + offsetMin;

    const sign = offset > 0 ? "-" : "+";
    return sign + hrsString + ":" + minString;
  }
});
