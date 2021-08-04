import { TestBed } from "@angular/core/testing";

import { ExportService } from "./export.service";
import { ConfigurableEnumValue } from "../../configurable-enum/configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
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

describe("ExportService", () => {
  let service: ExportService;
  let db: PouchDatabase;

  beforeEach(async () => {
    db = await PouchDatabase.createWithInMemoryDB("export-service-tests");

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
      ],
    });

    service = TestBed.inject<ExportService>(ExportService);
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
    class TestClass {
      _id;
      _rev;
      propOne;
      propTwo;
    }
    const test = new TestClass();
    test._id = 1;
    test._rev = 2;
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
      [{ label: "test name", query: "name" }]
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
    expect(columnValues).toHaveSize(3 + 1);
    expect(columnValues).toContain('"' + testEnumValue.label + '"');
    expect(columnValues).toContain(new Date(testDate).toISOString());
    expect(columnValues).toContain('"true"');
  });

  it("should load fields from related entity for joint export", async () => {
    const child1 = new Child("child1");
    child1.name = "John";
    await db.put(child1);

    const child2 = new Child("child2");
    child2.name = "Jane";
    await db.put(child2);

    const school1 = new School("school1");
    school1.name = "School with student";
    await db.put(school1);
    const childSchool1 = new ChildSchoolRelation();
    childSchool1.childId = child1.getId();
    childSchool1.schoolId = school1.getId();
    await db.put(childSchool1);

    const school2 = new School("school2");
    school2.name = "School without student";
    await db.put(school2);

    const school3 = new School("school3");
    school3.name = "School with multiple students";
    await db.put(school3);
    const childSchool3a = new ChildSchoolRelation();
    childSchool3a.childId = child1.getId();
    childSchool3a.schoolId = school3.getId();
    await db.put(childSchool3a);
    const childSchool3b = new ChildSchoolRelation();
    childSchool3b.childId = child2.getId();
    childSchool3b.schoolId = school3.getId();
    await db.put(childSchool3b);

    const query1 =
      ":getRelated(ChildSchoolRelation, schoolId).childId:toEntities(Child).name";
    const exportConfig: ExportColumnConfig[] = [
      { label: "school name", query: "name" },
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
    const child1 = new Child("child1");
    child1.name = "John";
    await db.put(child1);

    const child2 = new Child("child2");
    child2.name = "Jane";
    await db.put(child2);

    const child3 = new Child("child3");
    child3.name = "Jack";
    await db.put(child3);

    const noteA = new Note("noteA");
    noteA.subject = "A";
    noteA.children = [child1.getId(), child2.getId()];
    await db.put(noteA);

    const noteB = new Note("noteB");
    noteB.subject = "B";
    noteB.children = [child1.getId(), child3.getId()];
    await db.put(noteB);

    const query = ".children:toEntities(Child).name";
    const exportConfig: ExportColumnConfig[] = [
      { label: "note", query: "subject" },
      { label: "participant", query: query, extendIntoMultipleRows: true },
    ];
    const result1 = await service.createCsv([noteA, noteB], exportConfig);
    const resultRows = result1.split(ExportService.SEPARATOR_ROW);
    expect(resultRows).toEqual([
      `"${exportConfig[0].label}","${exportConfig[1].label}"`,
      '"A","John"',
      '"A","Jane"',
      '"B","John"',
      '"B","Jack"',
    ]);
  });
});
