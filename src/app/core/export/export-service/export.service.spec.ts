import { TestBed } from "@angular/core/testing";

import { ExportService } from "./export.service";
import { ConfigurableEnumValue } from "../../configurable-enum/configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { BackupService } from "../../admin/services/backup.service";

describe("ExportService", () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportService],
    });

    service = TestBed.inject<ExportService>(ExportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create the correct json object", () => {
    class TestClass {
      propertyOne;
      propertyTwo;
    }
    const test = new TestClass();
    test.propertyOne = "Hello";
    test.propertyTwo = "World";

    const result = service.createJson([test]);

    const expected = JSON.stringify({
      propertyOne: "Hello",
      propertyTwo: "World",
    });
    expect(result).toEqual(expected);
  });

  it("should transform a json array", () => {
    class TestClass {
      propertyOne;
      propertyTwo;
    }
    const test = new TestClass();
    test.propertyOne = "Hello";
    test.propertyTwo = "World";

    const result = service.createJson([test, test]);

    let expected = JSON.stringify({
      propertyOne: "Hello",
      propertyTwo: "World",
    });
    expected += BackupService.SEPARATOR_ROW;
    expected += JSON.stringify({ propertyOne: "Hello", propertyTwo: "World" });
    expect(result).toEqual(expected);
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

  it("should export all properties", async () => {
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

    expect(csvResult).toBe(
      '"name","age","extra"\r\n"foo","12",\r\n"bar","15","1"'
    );
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
      [{ label: "test name", key: "name" }]
    );

    expect(csvResult).toBe('"test name"\r\n"foo"\r\n"bar"');
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
    expect(columnValues).toContain('"1"'); // true => "1"
  });
});
