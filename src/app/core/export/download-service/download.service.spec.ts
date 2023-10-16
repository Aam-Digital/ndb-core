import { TestBed } from "@angular/core/testing";

import { LoggingService } from "../../logging/logging.service";
import { DownloadService } from "./download.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";

describe("DownloadService", () => {
  let service: DownloadService;
  let mockDataTransformationService: jasmine.SpyObj<DownloadService>;
  const exportConfig =[]

  beforeEach(() => {
    mockDataTransformationService = jasmine.createSpyObj([
      "queryAndTransformData",
    ]);
    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        {
          provide: DataTransformationService,
          useValue: mockDataTransformationService,
        },
        LoggingService,
      ],
    });
    service = TestBed.inject(DownloadService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("opens download link when pressing button", async () => {
    const link = document.createElement("a");
    const clickSpy = spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = jasmine
      .createSpy("HTML Element")
      .and.returnValue(link);

    expect(clickSpy).not.toHaveBeenCalled();
    await service.triggerDownload([], "json", "someFileName");
    expect(clickSpy).toHaveBeenCalled();
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  });
  it("should contain a column for every property", async () => {
    const docs = [
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", other: 2 },
    ];

    const csvExport = await service.createCsv(docs,exportConfig);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveSize(2 + 1); // includes 1 header line
    expect(rows[0].split(DownloadService.SEPARATOR_COL)).toHaveSize(3);
  });

  it("should create a csv string correctly", async () => {
    @DatabaseEntity("TestForCsvEntity")
    class TestClass extends Entity {
      propOne;
      propTwo;
    }

    const test = new TestClass("1");
    test._rev = "2";
    test.propOne = "first";
    test.propTwo = "second";
    const expected =
      '"_id","_rev","propOne","propTwo"' +
      DownloadService.SEPARATOR_ROW +
      '"TestForCsvEntity:1","2","first","second"';
    const result = await service.createCsv([test],exportConfig);
    expect(result).toEqual(expected);
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

    const csvExport = await service.createCsv([testEntity],exportConfig);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);
    expect(columnValues).toHaveSize(3 + 1); // Properties + _id
    expect(columnValues).toContain('"' + testEnumValue.label + '"');
    expect(columnValues).toContain('"' + testDate + '"');
    expect(columnValues).toContain('"true"');
  });

  it("should export a date as YYYY-MM-dd only", async () => {
    const dateString = "2021-01-01";
    const dateObject = new Date(dateString);
    dateObject.setHours(10, 11, 12);

    const exportData = [
      {
        date: dateObject,
        number: 10,
        string: "someString",
      },
    ];

    const csv = await service.createCsv(exportData,exportConfig);

    const results = csv.split(DownloadService.SEPARATOR_ROW);
    expect(results).toEqual([
      '"date","number","string"',
      `"${dateString}","10","someString"`,
    ]);
  });
});
