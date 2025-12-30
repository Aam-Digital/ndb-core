import { TestBed } from "@angular/core/testing";

import { ImportService } from "./import.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import {
  expectEntitiesToBeInDatabase,
  expectEntitiesToMatch,
} from "../../utils/expect-entity-data.spec";
import moment from "moment";
import { mockEntityMapperProvider } from "../entity/entity-mapper/mock-entity-mapper-service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../demo-data/create-entity-of-type";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

describe("ImportService", () => {
  let service: ImportService;

  let entityMapper: EntityMapperService;

  class ImportTestTarget extends Entity {
    @DatabaseField() name: string;
    @DatabaseField() counter: number;
    @DatabaseField() date: Date;
    @DatabaseField() text: string;
    @DatabaseField({
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: "Child",
    })
    entityRefs: string[];
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [ImportService, ...mockEntityMapperProvider()],
    });
    service = TestBed.inject(ImportService);

    entityMapper = TestBed.inject(EntityMapperService);
  });

  it("should execute import, saving entities and creating history record", async () => {
    const testEntities: Entity[] = [new Entity("1"), new Entity("2")];
    const testImportSettings: ImportSettings = {
      entityType: "Entity",
      columnMapping: undefined,
    };
    spyOn(entityMapper, "saveAll");
    spyOn(entityMapper, "save");

    await service.executeImport(testEntities, testImportSettings);

    expect(entityMapper.saveAll).toHaveBeenCalledWith(testEntities);

    expect(entityMapper.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        createdEntities: testEntities.map((e) => e.getId()),
        config: testImportSettings,
      } as Partial<ImportMetadata>),
    );
  });

  it("should transform raw data to mapped entities", async () => {
    spyOn(TestBed.inject(EntityRegistry), "get").and.callFake(
      (entityType: string) =>
        entityType === "ImportTestTarget" ? ImportTestTarget : TestEntity,
    );

    const rawData: any[] = [
      { rawName: "John", rawCounter: "111" },
      { rawName: "Jane" },
      { rawName: "broken date", rawCounter: "foo" }, // number column; ("rawCounter") ignored
      { rawName: "with broken mapping column", brokenMapping: "foo" }, // column mapped to non-existing property ignored
      { rawName: "", onlyUnmappedColumn: "1" }, // only empty or unmapped columns => row skipped
      { rawName: "with zero", rawCounter: "0" }, // 0 value mapped
      { rawName: "custom mapping fn", rawDate: "30.01.2023" },
      {
        rawName: "no null",
        rawCounter: null,
        rawText: null,
        rawDate: null,
      },
      {
        rawName: "no undefined",
        rawCounter: undefined,
        rawText: undefined,
        rawDate: undefined,
      },
    ];
    const columnMapping: ColumnMapping[] = [
      { column: "rawName", propertyName: "name" },
      { column: "rawCounter", propertyName: "counter" },
      { column: "rawDate", propertyName: "date", additional: "DD.MM.YYYY" },
      { column: "brokenMapping", propertyName: "brokenMapping" },
      { column: "rawText", propertyName: "text" },
    ];

    const parsedEntities = await service.transformRawDataToEntities(rawData, {
      entityType: "ImportTestTarget",
      columnMapping,
    });

    let expectedEntities: any[] = [
      { name: "John", counter: 111 },
      { name: "Jane" },
      { name: "broken date" },
      { name: "with broken mapping column" },
      { name: "with zero", counter: 0 },
      { name: "custom mapping fn", date: moment("2023-01-30").toDate() },
      { name: "no null" },
      { name: "no undefined" },
    ];

    expectEntitiesToMatch(
      parsedEntities,
      expectedEntities.map((e) => Object.assign(new ImportTestTarget(), e)),
      true,
    );
  });

  it("should map entity reference field with multiple columns mapped as identifiers", async () => {
    spyOn(TestBed.inject(EntityRegistry), "get").and.callFake(
      (entityType: string) =>
        entityType === "ImportTestTarget" ? ImportTestTarget : TestEntity,
    );

    const ref = TestEntity.create({ name: "John", other: "match" });
    const ref2 = TestEntity.create({ name: "Jane", other: "match" });
    await entityMapper.saveAll([ref, ref2]);

    const rawData: any[] = [
      { text: "match 1", rawName: "John", rawOther: "match" },
      { text: "match 2", rawName: "Jane", rawOther: "match" },
      { text: "mismatching", rawName: "John", rawOther: "non-match" },
      { text: "incomplete matching", rawName: "John" }, // only match if all mapped identifiers match
    ];
    const columnMapping: ColumnMapping[] = [
      { column: "rawName", propertyName: "entityRefs", additional: "name" },
      { column: "rawOther", propertyName: "entityRefs", additional: "other" },
      { column: "text", propertyName: "text" },
    ];

    // Run
    const parsedEntities = await service.transformRawDataToEntities(rawData, {
      entityType: "ImportTestTarget",
      columnMapping,
    });

    // Verify
    let expectedEntities: any[] = [
      { text: "match 1", entityRefs: [ref.getId()] },
      { text: "match 2", entityRefs: [ref2.getId()] },
      { text: "mismatching" },
      { text: "incomplete matching" },
    ];

    expectEntitiesToMatch(
      parsedEntities,
      expectedEntities.map((e) => Object.assign(new ImportTestTarget(), e)),
      true,
    );
  });

  it("should allow to remove entities with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: "Child",
      columnMapping: undefined,
    };
    importMeta.createdEntities = ["Child:1", "Child:2"];
    const children = ["1", "2", "3"].map((id) =>
      createEntityOfType("Child", id),
    );
    await entityMapper.saveAll([...children, importMeta]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([children[2]], false, true);
    await expectAsync(
      entityMapper.load(ImportMetadata, importMeta.getId()),
    ).toBeRejected();
  });

  it("should not fail undo if some entities have already been removed", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: undefined,
    };
    importMeta.createdEntities = [
      TestEntity.ENTITY_TYPE + ":1",
      TestEntity.ENTITY_TYPE + ":2",
    ];
    const children = ["1", "2", "3"].map((id) => new TestEntity(id));
    await entityMapper.saveAll([...children, importMeta]);

    await entityMapper.remove(children[1]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([children[2]], false, true);
  });

  it("should parse array fields from comma-separated values", async () => {
    class ArrayImportTestEntity extends Entity {
      @DatabaseField() name: string;
      @DatabaseField({ isArray: true }) items: string[];
    }

    spyOn(TestBed.inject(EntityRegistry), "get").and.returnValue(
      ArrayImportTestEntity,
    );

    const schemaService = TestBed.inject(EntitySchemaService);
    const mockDatatype = schemaService.getDatatypeOrDefault("string");
    const importMapFunctionSpy = spyOn(
      mockDatatype,
      "importMapFunction",
    ).and.callThrough();

    const rawData: any[] = [
      { name: "json array", items: '["one", "two"]' },
      { name: "comma-separated values", items: "two, three" },
      { name: "single value", items: "two" },
      { name: "empty string", items: "" },
      { name: "invalid json", items: '["broken"' },
    ];
    const columnMapping: ColumnMapping[] = [
      { column: "name", propertyName: "name" },
      { column: "items", propertyName: "items" },
    ];

    const parsedEntities = (await service.transformRawDataToEntities(rawData, {
      entityType: "ArrayImportTestEntity",
      columnMapping,
    })) as ArrayImportTestEntity[];

    expect(importMapFunctionSpy).toHaveBeenCalled();

    expect(parsedEntities.length).toBe(5);
    expect(parsedEntities[0].items).toEqual(["one", "two"]);
    expect(parsedEntities[1].items).toEqual(["two", "three"]);
    expect(parsedEntities[2].items).toEqual(["two"]);
    expect(parsedEntities[3].items).toBeUndefined();
    expect(parsedEntities[4].items).toEqual(['["broken"']); // invalid JSON treated as single string value
  });
});
