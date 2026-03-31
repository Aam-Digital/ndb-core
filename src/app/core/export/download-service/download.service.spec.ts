import { TestBed } from "@angular/core/testing";
import { DownloadService } from "./download.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";

import { DatabaseField } from "../../entity/database-field.decorator";
import moment from "moment";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { GeoLocation } from "app/features/location/geo-location";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { Papa } from "ngx-papaparse";
import { parse, unparse } from "papaparse";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { AttendanceDatatype } from "../../../features/attendance/model/attendance.datatype";

describe("DownloadService", () => {
  let service: DownloadService;
  let mockDataTransformationService: any;
  let mockedEntityMapper: any;
  const testSchool = TestEntity.create({ name: "Test School" });
  const testChild = TestEntity.create("Test Child");

  beforeEach(() => {
    mockDataTransformationService = {
      queryAndTransformData: vi.fn(),
    };
    mockedEntityMapper = {
      load: vi.fn(),
    };
    mockedEntityMapper.load.mockImplementation(async (entityType, id) => {
      switch (id) {
        case testChild.getId():
          return testChild as any;
        case testSchool.getId():
          return testSchool as any;
        default:
          throw new Error();
      }
    });

    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        {
          provide: DataTransformationService,
          useValue: mockDataTransformationService,
        },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        {
          provide: EntityActionsService,
          useValue: { anonymize: vi.fn() },
        },
        {
          provide: DefaultDatatype,
          useClass: EntityDatatype,
          multi: true,
        },
        {
          provide: DefaultDatatype,
          useClass: AttendanceDatatype,
          multi: true,
        },
        {
          provide: Papa,
          useValue: {
            unparse: (...args: Parameters<typeof unparse>) => unparse(...args),
          },
        },
      ],
    });
    service = TestBed.inject(DownloadService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("opens download link when pressing button", async () => {
    const link = document.createElement("a");
    const clickSpy = vi.spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = vi.fn().mockReturnValue(link);

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

    const csvExport = await service.createCsv(docs);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(2 + 1); // includes 1 header line
    expect(rows[0].split(DownloadService.SEPARATOR_COL)).toHaveLength(3);
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
    vi.spyOn(service, "exportFile").mockResolvedValue(expected);
    const result = await service.createCsv([test]);
    expect(result).toEqual(expected);
  });

  it("should transform object values to their label for export when available (e.g. configurable-enum)", async () => {
    const testEnumValue: ConfigurableEnumValue = {
      id: "ID VALUE",
      label: "label value",
    };
    const testDate = "2020-01-30";

    @DatabaseEntity("ValuesDownloadTestEntity")
    class ValuesDownloadTestEntity extends Entity {
      @DatabaseField({ label: "test enum" })
      enumProperty: ConfigurableEnumValue;
      @DatabaseField({ label: "test date" })
      dateProperty: Date;
      @DatabaseField({ label: "test boolean" })
      boolProperty: boolean;
    }

    const testEntity = new ValuesDownloadTestEntity();
    testEntity.enumProperty = testEnumValue;
    testEntity.dateProperty = moment(testDate).toDate();
    testEntity.boolProperty = true;

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);
    expect(columnValues).toHaveLength(3); // Properties (_id is filter out by default)
    expect(columnValues).toContain('"' + testEnumValue.label + '"');
    expect(columnValues).toContain('"' + testDate + '"');
    expect(columnValues).toContain('"true"');
  });

  it("should add columns with entity toString for referenced entities in export", async () => {
    class EntityRefDownloadTestEntity extends Entity {
      @DatabaseField({ dataType: "entity", label: "referenced entity" })
      relatedEntity: string;
      @DatabaseField({ dataType: "entity", label: "referenced entity 2" })
      relatedEntity2: string;
    }

    const relatedEntity = testSchool;
    const relatedEntity2 = testChild;

    const testEntity = new EntityRefDownloadTestEntity();
    testEntity.relatedEntity = relatedEntity.getId();
    testEntity.relatedEntity2 = relatedEntity2.getId();

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);
    expect(columnValues).toHaveLength(4);
    expect(columnValues).toContain('"' + relatedEntity.getId() + '"');
    expect(columnValues).toContain('"' + relatedEntity.toString() + '"');
    expect(columnValues).toContain('"' + relatedEntity2.getId() + '"');
    expect(columnValues).toContain('"' + relatedEntity2.toString() + '"');
  });

  it("should add column with entity toString for referenced array of entities in export", async () => {
    class EntityRefDownloadTestEntity extends Entity {
      @DatabaseField({
        dataType: EntityDatatype.dataType,
        isArray: true,
        label: "referenced entities",
      })
      relatedEntitiesArray: string[];
    }

    const testEntity = new EntityRefDownloadTestEntity();
    testEntity.relatedEntitiesArray = [testSchool.getId(), testChild.getId()];

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(1 + 1); // includes 1 header line
    expect(rows[1]).toBe(
      `"${testSchool.getId()},${testChild.getId()}","${testSchool.toString()},${testChild.toString()}"`,
    );
  });

  it("should handle undefined entity ids without errors", async () => {
    class EntityRefDownloadTestEntity extends Entity {
      @DatabaseField({
        dataType: EntityDatatype.dataType,
        isArray: true,
        label: "referenced entities",
      })
      relatedEntitiesArray: string[];
    }

    const testEntity = new EntityRefDownloadTestEntity();
    testEntity.relatedEntitiesArray = ["undefined-id", testChild.getId()];

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(1 + 1); // includes 1 header line
    expect(rows[1]).toBe(
      `"undefined-id,${testChild.getId()}","<not_found>,${testChild.toString()}"`,
    );
  });

  it("should add participant count and participation details columns in export", async () => {
    class AttendanceDownloadTestEntity extends Entity {
      @DatabaseField({
        dataType: AttendanceDatatype.dataType,
        isArray: true,
        label: "attendance",
      })
      attendance: any[];
    }

    const testEntity = new AttendanceDownloadTestEntity();
    testEntity.attendance = [
      {
        participant: testSchool.getId(),
        status: { label: "Present" },
        remarks: "",
      },
      {
        participant: testChild.getId(),
        status: { label: "Absent" },
        remarks: "Sick",
      },
    ];

    const csvExport = await service.createCsv([testEntity]);
    const parsed = parse<Record<string, string>>(csvExport, {
      header: true,
      skipEmptyLines: true,
    });

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.meta.fields).toContain("attendance (number of participants)");
    expect(parsed.meta.fields).toContain("attendance (participation details)");

    expect(parsed.data[0]["attendance (number of participants)"]).toBe("2");
    expect(parsed.data[0]["attendance (participation details)"]).toBe(
      `${testSchool.toString()} (Present), ${testChild.toString()} (Absent)`,
    );
  });

  it("should stringify object values when csv output would otherwise be [object Object]", async () => {
    @DatabaseEntity("ObjectFieldDownloadTestEntity")
    class ObjectFieldDownloadTestEntity extends Entity {
      @DatabaseField({ label: "details" })
      details: any;
    }

    const testEntity = new ObjectFieldDownloadTestEntity();
    testEntity.details = { a: 1, nested: { b: "x" } };

    const csvExport = await service.createCsv([testEntity]);
    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);

    expect(rows).toHaveLength(1 + 1); // includes 1 header line
    expect(rows[1]).not.toContain("[object Object]");
    expect(rows[1]).toContain('""a"":1');
    expect(rows[1]).toContain('""nested"":{');
  });

  it("should export all properties using object keys as headers, if no schema is available", async () => {
    const docs = [
      { _id: "Test:1", name: "Child 1" },
      { _id: "Test:2", name: "Child 2" },
    ];

    const csvExport = await service.createCsv(docs);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(2 + 1); // includes 1 header line
    const columnHeaders = rows[0].split(DownloadService.SEPARATOR_COL);
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);

    expect(columnValues).toHaveLength(2);
    expect(columnHeaders).toHaveLength(2);
    expect(columnHeaders).toContain('"_id"');
  });

  it("should only export columns that have labels defined in entity schema and use the schema labels as export headers", async () => {
    const testString: string = "Test 1";

    @DatabaseEntity("LabelDownloadTestEntity")
    class LabelDownloadTestEntity extends Entity {
      @DatabaseField({ label: "test string" })
      stringProperty: string;
      @DatabaseField({ label: "test date" })
      otherProperty: string;
      @DatabaseField()
      boolProperty: boolean;
    }

    const labelTestEntity = new LabelDownloadTestEntity();
    labelTestEntity.stringProperty = testString;
    labelTestEntity.otherProperty = "x";
    labelTestEntity.boolProperty = true;

    const incompleteTestEntity = new LabelDownloadTestEntity();
    incompleteTestEntity.otherProperty = "second row";

    const csvExport = await service.createCsv([
      labelTestEntity,
      incompleteTestEntity,
    ]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveLength(1 + 2); // includes 1 header line

    const columnHeaders = rows[0].split(DownloadService.SEPARATOR_COL);
    expect(columnHeaders).toHaveLength(2);
    expect(columnHeaders).toContain('"test string"');
    expect(columnHeaders).toContain('"test date"');

    const entity2Values = rows.find((r) => r.includes("second row"));
    expect(entity2Values).toEqual(',"second row"'); // first column empty!
  });

  it("should export a date as YYYY-MM-dd only", async () => {
    const dateString = "2021-01-01";
    const dateObject = moment(dateString).toDate();
    dateObject.setHours(10, 11, 12);

    const exportData = [
      {
        date: dateObject,
        number: 10,
        string: "someString",
      },
    ];

    const csv = await service.createCsv(exportData);

    const results = csv.split(DownloadService.SEPARATOR_ROW);
    expect(results).toEqual([
      '"date","number","string"',
      `"${dateString}","10","someString"`,
    ]);
  });

  it("should export a location as its locationString only", async () => {
    const locationObject: GeoLocation = {
      locationString: "Test Location",
      geoLookup: { lat: 0, lon: 0, display_name: "lookup location" },
    };

    const exportData = [
      {
        address: locationObject,
      },
    ];

    const csv = await service.createCsv(exportData);

    const results = csv.split(DownloadService.SEPARATOR_ROW);
    expect(results).toEqual([
      '"address"',
      `"${locationObject.locationString}"`,
    ]);
  });
});
