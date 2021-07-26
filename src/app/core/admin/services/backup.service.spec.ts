import { TestBed } from "@angular/core/testing";

import { BackupService } from "./backup.service";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { ConfigurableEnumValue } from "../../configurable-enum/configurable-enum.interface";
import { Entity } from "../../entity/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { DatabaseEntity } from "../../entity/database-entity.decorator";

describe("BackupService", () => {
  let db: PouchDatabase;
  let service: BackupService;

  beforeEach(() => {
    db = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      providers: [BackupService, { provide: Database, useValue: db }],
    });

    service = TestBed.inject<BackupService>(BackupService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("clearDatabase should remove all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });

    const res = await db.getAll();
    expect(res).toHaveSize(1);

    await service.clearDatabase();

    const resAfter = await db.getAll();
    expect(resAfter).toHaveSize(0);
  });

  it("getJsonExport should return all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res).toHaveSize(2);

    const jsonExport = await service.getJsonExport();

    expect(jsonExport.split(BackupService.SEPARATOR_ROW)).toHaveSize(2);
  });

  it("getJsonExport | clearDatabase | importJson should restore all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const originalData = await db.getAll();
    expect(originalData).toHaveSize(2);

    const backup = await service.getJsonExport();
    await service.clearDatabase();
    await service.importJson(backup, true);

    const res = await db.getAll();
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty)).toEqual(
      originalData.map(ignoreRevProperty),
      "restored records not identical to original records (_rev ignored)"
    );
  });

  it("getCsvExport should contain a line for every record", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res.length).toBe(2);

    const csvExport = await service.getCsvExport();

    expect(csvExport.split(BackupService.SEPARATOR_ROW)).toHaveSize(2 + 1); // includes 1 header line
  });

  it("getCsvExport should contain a column for every property", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", other: 2 });
    const res = await db.getAll();
    expect(res).toHaveSize(2);

    const csvExport = await service.getCsvExport();

    const rows = csvExport.split(BackupService.SEPARATOR_ROW);
    expect(rows).toHaveSize(2 + 1); // includes 1 header line
    expect(rows[0].split(BackupService.SEPARATOR_COL)).toHaveSize(3 + 1); // includes _rev
  });

  it("importCsv should add records", async () => {
    const csv =
      "_id" +
      BackupService.SEPARATOR_COL +
      "test" +
      BackupService.SEPARATOR_ROW +
      '"Test:1"' +
      BackupService.SEPARATOR_COL +
      "1" +
      BackupService.SEPARATOR_ROW +
      '"Test:2"' +
      BackupService.SEPARATOR_COL +
      "2" +
      BackupService.SEPARATOR_ROW;

    await service.importCsv(csv, true);

    const res = await db.getAll();
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty)).toEqual([
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", test: 2 },
    ]);
  });

  it("importCsv should not add empty properties to records", async () => {
    const csv =
      "_id" +
      BackupService.SEPARATOR_COL +
      "other" +
      BackupService.SEPARATOR_COL +
      "test" +
      BackupService.SEPARATOR_ROW +
      '"Test:1"' +
      BackupService.SEPARATOR_COL +
      BackupService.SEPARATOR_COL +
      "1";

    await service.importCsv(csv);

    const res = await db.getAll();
    expect(res).toHaveSize(1);
    expect(res[0].other).toBeUndefined("empty property was added anyway");
    expect(res.map(ignoreRevProperty)).toEqual([{ _id: "Test:1", test: 1 }]);
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }

  it("exportJson creates the correct json object", () => {
    class TestClass {
      propertyOne;
      propertyTwo;
    }
    const test = new TestClass();
    test.propertyOne = "Hello";
    test.propertyTwo = "World";
    const expected = JSON.stringify({
      propertyOne: "Hello",
      propertyTwo: "World",
    });
    const result = service.createJson([test]);
    expect(result).toEqual(expected);
  });

  it("exportJson transforms an json array correctly", () => {
    class TestClass {
      propertyOne;
      propertyTwo;
    }
    const test = new TestClass();
    test.propertyOne = "Hello";
    test.propertyTwo = "World";
    let expected = JSON.stringify({
      propertyOne: "Hello",
      propertyTwo: "World",
    });
    expected += BackupService.SEPARATOR_ROW;
    expected += JSON.stringify({ propertyOne: "Hello", propertyTwo: "World" });
    const result = service.createJson([test, test]);
    expect(result).toEqual(expected);
  });

  it("should create a csv string correctly", () => {
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
      '"_id","_rev","propOne","propTwo"\r\n"1","2","first","second"';
    const result = service.createCsv([test]);
    expect(result).toEqual(expected);
  });

  it("should create a csv string correctly with multiple objects", () => {
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
      '"_id","_rev","propOne","propTwo"\r\n"1","2","first","second"\r\n"1","2","first","second"';
    const result = service.createCsv([test, test]);
    expect(result).toEqual(expected);
  });

  it("getCsvExport should transform object properties to their label for export", async () => {
    const testEnumValue: ConfigurableEnumValue = {
      id: "ID VALUE",
      label: "label value",
    };
    const testDate = "2020-01-30";

    @DatabaseEntity("TestEntity")
    class TestEntity extends Entity {
      @DatabaseField() enumProperty: ConfigurableEnumValue;
      @DatabaseField() dateProperty: Date;
    }

    const testEntity = new TestEntity();
    testEntity.enumProperty = testEnumValue;
    testEntity.dateProperty = new Date(testDate);

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(BackupService.SEPARATOR_ROW);
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(BackupService.SEPARATOR_COL);
    expect(columnValues).toHaveSize(2 + 1);
    expect(columnValues).toContain('"' + testEnumValue.label + '"');
    expect(columnValues).toContain(new Date(testDate).toISOString());
  });
});
