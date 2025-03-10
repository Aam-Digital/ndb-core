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
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../demo-data/create-entity-of-type";
import { DateWithAge } from "../basic-datatypes/date-with-age/dateWithAge";

describe("ImportService", () => {
  let service: ImportService;

  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        ImportService,
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    });
    service = TestBed.inject(ImportService);
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
        ids: testEntities.map((e) => e.getId()),
        config: testImportSettings,
      }),
    );
  });

  it("should transform raw data to mapped entities", async () => {
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

    spyOn(TestBed.inject(EntityRegistry), "get").and.callFake(
      (entityType: string) =>
        entityType === "ImportTestTarget" ? ImportTestTarget : TestEntity,
    );

    const child = TestEntity.create("Child Name");
    await entityMapper.save(child);

    const rawData: any[] = [
      { rawName: "John", rawCounter: "111" },
      { rawName: "Jane" },
      { rawName: "broken date", rawCounter: "foo" }, // number column; ("rawCounter") ignored
      { rawName: "with broken mapping column", brokenMapping: "foo" }, // column mapped to non-existing property ignored
      { rawName: "", onlyUnmappedColumn: "1" }, // only empty or unmapped columns => row skipped
      { rawName: "with zero", rawCounter: "0" }, // 0 value mapped
      { rawName: "custom mapping fn", rawDate: "30.01.2023" },
      { rawName: "entity array", rawRefName: child.name },
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
      { column: "rawRefName", propertyName: "entityRefs", additional: "name" },
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
      { name: "entity array", entityRefs: [child.getId()] },
      { name: "no null" },
      { name: "no undefined" },
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
    importMeta.ids = ["Child:1", "Child:2"];
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
    importMeta.ids = [
      TestEntity.ENTITY_TYPE + ":1",
      TestEntity.ENTITY_TYPE + ":2",
    ];
    const children = ["1", "2", "3"].map((id) => new TestEntity(id));
    await entityMapper.saveAll([...children, importMeta]);

    await entityMapper.remove(children[1]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([children[2]], false, true);
  });

  it("should use existing records to be updated, if idFields are given", async () => {
    const existingRecords: Entity[] = [
      TestEntity.create({
        name: "A",
        dateOfBirth: new DateWithAge("2000-01-01"),
        other: "old value",
        category: { id: "X", label: "X" },
        _rev: "A1",
      }),
      TestEntity.create({
        name: "B",
        _rev: "B1",
      }),
      TestEntity.create({
        name: "C",
        dateOfBirth: new DateWithAge("2000-03-03"),
        _rev: "C1",
      }),
      TestEntity.create({ name: "X", _rev: "X1" }),
    ];
    await entityMapper.saveAll(existingRecords);

    const rawData: any[] = [
      {
        d: "match existing",
        rawName: "A",
        DoB: "2000-01-01",
        other: "new value",
      },
      {
        d: "match part, mismatch part",
        rawName: "A2",
        DoB: "2000-01-01",
      },
      { d: "match part", rawName: "B", DoB: "2022-12-31" },
      { d: "match part", rawName: "C" },
      { d: "not matching", rawName: "XXX" },
    ];
    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "rawName", propertyName: "name" },
        { column: "DoB", propertyName: "dateOfBirth" },
        { column: "other", propertyName: "other" },
      ],
      idFields: ["name", "dateOfBirth"],
    };

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      importSettings,
    );

    let expectedEntities: any[] = [
      {
        _rev: existingRecords[0]["_rev"], // matched by name + dateOfBirth
        _id: existingRecords[0]["_id"],
        name: "A",
        dateOfBirth: parsedEntities[0]["dateOfBirth"],
        other: "new value", // updated
        category: { id: "X", label: "X" }, // not touched from existing entity
      },
      {
        // not matched
        name: "A2",
        dateOfBirth: parsedEntities[1]["dateOfBirth"],
      },
      {
        _rev: existingRecords[1]["_rev"], // matched by name, entity missing dateOfBirth
        _id: existingRecords[1]["_id"],
        name: "B",
        dateOfBirth: parsedEntities[2]["dateOfBirth"],
      },
      {
        _rev: existingRecords[2]["_rev"], // matched by name, imported row missing dateOfBirth
        _id: existingRecords[2]["_id"],
        name: "C",
      },
      { name: "XXX" }, // not matched
    ];

    expect(parsedEntities).toEqual(
      expectedEntities.map((x) => jasmine.objectContaining(x)),
    );
  });
});
