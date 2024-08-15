import { TestBed } from "@angular/core/testing";
import { DownloadService } from "./download.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";
import moment from "moment";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Child } from "app/child-dev-project/children/model/child";
import { mockEntityMapper } from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("DownloadService", () => {
  let service: DownloadService;
  let mockDataTransformationService: jasmine.SpyObj<DownloadService>;
  let mockedEntityMapper;
  const testSchool = TestEntity.create({ name: "Test School" });
  const testChild = Child.create("Test Child");

  beforeEach(() => {
    mockDataTransformationService = jasmine.createSpyObj([
      "queryAndTransformData",
    ]);
    mockedEntityMapper = mockEntityMapper([testSchool, testChild]);
    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        {
          provide: DataTransformationService,
          useValue: mockDataTransformationService,
        },
        {
          provide: EntityMapperService,
          useValue: mockedEntityMapper,
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

    const csvExport = await service.createCsv(docs);

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
    spyOn(service, "exportFile").and.resolveTo(expected);
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
      @DatabaseField({ label: "test date" }) dateProperty: Date;
      @DatabaseField({ label: "test boolean" }) boolProperty: boolean;
    }

    const testEntity = new ValuesDownloadTestEntity();
    testEntity.enumProperty = testEnumValue;
    testEntity.dateProperty = moment(testDate).toDate();
    testEntity.boolProperty = true;

    const csvExport = await service.createCsv([testEntity]);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);
    expect(columnValues).toHaveSize(3); // Properties (_id is filter out by default)
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
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);
    expect(columnValues).toHaveSize(4);
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
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
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
    expect(rows).toHaveSize(1 + 1); // includes 1 header line
    expect(rows[1]).toBe(
      `"undefined-id,${testChild.getId()}","<not_found>,${testChild.toString()}"`,
    );
  });

  it("should export all properties using object keys as headers, if no schema is available", async () => {
    const docs = [
      { _id: "Test:1", name: "Child 1" },
      { _id: "Test:2", name: "Child 2" },
    ];

    const csvExport = await service.createCsv(docs);

    const rows = csvExport.split(DownloadService.SEPARATOR_ROW);
    expect(rows).toHaveSize(2 + 1); // includes 1 header line
    const columnHeaders = rows[0].split(DownloadService.SEPARATOR_COL);
    const columnValues = rows[1].split(DownloadService.SEPARATOR_COL);

    expect(columnValues).toHaveSize(2);
    expect(columnHeaders).toHaveSize(2);
    expect(columnHeaders).toContain('"_id"');
  });

  it("should only export columns that have labels defined in entity schema and use the schema labels as export headers", async () => {
    const testString: string = "Test 1";

    @DatabaseEntity("LabelDownloadTestEntity")
    class LabelDownloadTestEntity extends Entity {
      @DatabaseField({ label: "test string" }) stringProperty: string;
      @DatabaseField({ label: "test date" }) otherProperty: string;
      @DatabaseField() boolProperty: boolean;
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
    expect(rows).toHaveSize(1 + 2); // includes 1 header line

    const columnHeaders = rows[0].split(DownloadService.SEPARATOR_COL);
    expect(columnHeaders).toHaveSize(2);
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
});
