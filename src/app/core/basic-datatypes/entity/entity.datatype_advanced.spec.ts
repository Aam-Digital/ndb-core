import { EntityDatatype } from "./entity.datatype";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ImportProcessingContext } from "../../import/import-processing-context";
import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { ImportService } from "../../import/import.service";
import { ColumnMapping } from "../../import/column-mapping";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";
import { Entity } from "../../entity/model/entity";

// separate test file for custom functionality of the EntityDatatype
// because there were conflicts with the standard tests in entity.datatype.spec.ts

describe("Schema data type: entity (advanced functionality)", () => {
  let entityMapper: MockEntityMapperService;
  let dataType: EntityDatatype;
  let schema: EntitySchemaField;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        EntityDatatype,
        ...mockEntityMapperProvider([]),
        {
          provide: EntityActionsService,
          useValue: {
            anonymize: vi.fn(),
          },
        },
      ],
    });
    dataType = TestBed.inject(EntityDatatype);

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    schema = TestEntity.schema.get("ref") as EntitySchemaField;
  });

  // NOTE ON SCOPE: the happy-path matching cases (basic string match, multi-column
  // narrowing, isArray/multi-value behavior) are covered end-to-end through
  // ImportService in the separate describe block at the bottom of this file. The
  // direct-call tests kept here cover orthogonal dimensions of importMatchField
  // that the end-to-end suite does not exercise: value-type coercion, the object
  // `additional` format, valueMapping, and the "no unique match -> undefined"
  // contract for a single-value target field.

  // Orthogonal: value-type coercion — a numeric import value must still match a
  // string-stored field (normalizeValue coerces both sides to string).
  it("should match a numeric import value against a string field", async () => {
    const c2 = new TestEntity();
    c2.other = "456"; // Ensure "other" is a string
    await entityMapper.saveAll([c2]);

    await expect(
      matchField([{ additional: "other", rawCell: 456 }]),
    ).resolves.toEqual(c2.getId());
  });

  // Orthogonal: the "no unique match -> undefined" contract. When multiple mapped
  // columns impose criteria that no single entity satisfies together, the result
  // must be undefined (the positive multi-column narrowing path is covered by the
  // end-to-end "single unique match" case).
  it("should match to undefined when mapped columns have no common match", async () => {
    const joe = new TestEntity();
    joe.name = "Joe";
    joe.other = "1";
    const max = new TestEntity();
    max.name = "Max";
    max.other = "2";
    await entityMapper.saveAll([joe, max]);

    // "Joe" exists and "2" exists, but no single entity has both -> no match
    await expect(
      matchField([
        { additional: "name", rawCell: "Joe" },
        { additional: "other", rawCell: "2" },
      ]),
    ).resolves.toBe(undefined);
  });

  it("should anonymize entity recursively", async () => {
    const referencedEntity = new TestEntity("ref-1");
    referencedEntity.name = "test";

    await entityMapper.saveAll([referencedEntity]);
    vi.spyOn(entityMapper, "save");
    const removeService = TestBed.inject(EntityActionsService);

    const testValue = referencedEntity.getId();
    const testSchemaField: EntitySchemaField = {
      additional: TestEntity.ENTITY_TYPE,
      dataType: "entity",
    };

    const anonymizedValue = await dataType.anonymize(
      testValue,
      testSchemaField,
      null,
    );

    expect(anonymizedValue).toEqual(testValue);
    expect(removeService.anonymize).toHaveBeenCalledWith(referencedEntity);
  });

  // Orthogonal: the `additional` config accepts both the legacy plain-string form
  // and the object `{ refField }` form. (Legacy string is also implicitly exercised
  // by the end-to-end suite; kept here as an explicit guard for both forms.)
  it("should match with both legacy-string and object { refField } additional", async () => {
    const legacy = TestEntity.create({ other: "legacyValue" });
    const object = TestEntity.create({ other: "objectValue" });
    await entityMapper.saveAll([legacy, object]);

    await expect(
      matchField([{ additional: "other", rawCell: "legacyValue" }]),
    ).resolves.toEqual(legacy.getId());

    await expect(
      matchField([
        { additional: { refField: "other" }, rawCell: "objectValue" },
      ]),
    ).resolves.toEqual(object.getId());
  });

  // Orthogonal: valueMapping runs the raw import value through the referenced
  // field's own datatype (here a date) before comparing.
  it("should match an entity ref with a date valueMapping", async () => {
    const entity = new TestEntity();
    // Store the date as it would be in DB format (YYYY-MM-DD)
    entity.dateOfBirth = new Date(1990, 4, 1) as any; // May 1, 1990
    await entityMapper.saveAll([entity]);

    await expect(
      matchField([
        {
          additional: { refField: "dateOfBirth", valueMapping: "DD.MM.YYYY" },
          rawCell: "01.05.1990",
        },
      ]),
    ).resolves.toEqual(entity.getId());
  });

  /**
   * Call importMatchField directly with the given columns mapped to `schema`
   * (a single-value entity-reference field on TestEntity).
   */
  function matchField(
    columns: { additional: any; rawCell: any }[],
  ): Promise<string | string[] | undefined> {
    const importContext = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: columns.map((c, i) => ({
        column: `col${i}`,
        propertyName: schema.id,
        additional: c.additional,
      })),
    });
    return dataType.importMatchField(
      schema,
      columns.map((c, i) => ({
        mapping: {
          column: `col${i}`,
          propertyName: schema.id,
          additional: c.additional,
        },
        rawCell: c.rawCell,
      })),
      importContext,
    );
  }
});

/**
 * End-to-end coverage of the entity-reference matching cases documented on
 * EntityDatatype.importMatchField, exercised through the real ImportService so
 * that column grouping per field is part of the assertion.
 *
 * Target entity has both a single-value (`singleRef`) and an array (`arrayRef`)
 * entity-reference field pointing at TestEntity, so each documented isArray case
 * can be triggered by mapping columns onto the matching field.
 */
describe("Schema data type: entity (import matching, end-to-end via ImportService)", () => {
  class ImportTarget extends Entity {
    @DatabaseField({
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    })
    singleRef: string;

    @DatabaseField({
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    })
    arrayRef: string[];
  }

  let service: ImportService;
  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [ImportService, ...mockEntityMapperProvider([])],
    });
    service = TestBed.inject(ImportService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;

    // register the "ImportTarget" type used only in this spec, alongside the
    // real registry entries (e.g. the referenced TestEntity type)
    const registry = TestBed.inject(EntityRegistry);
    if (!registry.has("ImportTarget")) {
      registry.add("ImportTarget", ImportTarget as any);
    }
  });

  async function runImport(row: any, columnMapping: ColumnMapping[]) {
    const { entities } = await service.transformRawDataToEntities([row], {
      entityType: "ImportTarget",
      columnMapping,
    });
    return entities[0] as ImportTarget | undefined;
  }

  // Case target field isArray===false, simple:
  //  { name: "John", other: "m" } --> the single unique match
  // Canonical happy-path: also covers basic string matching, multi-column
  // narrowing, and the legacy-string `additional` format ("name").
  it("links the single unique match (isArray=false, simple)", async () => {
    const john = TestEntity.create({ name: "John", other: "m" });
    const jane = TestEntity.create({ name: "Jane", other: "m" });
    await entityMapper.saveAll([john, jane]);

    const result = await runImport({ name: "John", other: "m" }, [
      { column: "name", propertyName: "singleRef", additional: "name" },
      { column: "other", propertyName: "singleRef", additional: "other" },
    ]);

    expect(result?.singleRef).toEqual(john.getId());
  });

  // Case target field isArray===false, complex multi-value:
  //  { name: "John,Jane", other: "x,y" } --> the single combination that matches
  // The cells are split and searched for every combination; exactly one
  // combination (John,x) matches an existing entity, so it resolves uniquely.
  it("links the single matching combination of multi-value cells (isArray=false)", async () => {
    const john = TestEntity.create({ name: "John", other: "x" });
    await entityMapper.saveAll([john]);

    const result = await runImport({ name: "John,Jane", other: "x,y" }, [
      { column: "name", propertyName: "singleRef", additional: "name" },
      { column: "other", propertyName: "singleRef", additional: "other" },
    ]);

    // only (John,x) matches an existing entity
    expect(result?.singleRef).toEqual(john.getId());
  });

  // Case target field isArray===true, simple:
  //  { name: "John", other: "m" } --> ALL records that match
  // An array target collects every matching record (not just a unique one).
  it("links all matching records for an array field (isArray=true, simple)", async () => {
    const john1 = TestEntity.create({ name: "John", other: "m" });
    const john2 = TestEntity.create({ name: "John", other: "m" });
    await entityMapper.saveAll([john1, john2]);

    const result = await runImport({ name: "John", other: "m" }, [
      { column: "name", propertyName: "arrayRef", additional: "name" },
      { column: "other", propertyName: "arrayRef", additional: "other" },
    ]);

    expect(result?.arrayRef).toEqual(
      expect.arrayContaining([john1.getId(), john2.getId()]),
    );
    expect(result?.arrayRef).toHaveLength(2);
  });

  // Case target field isArray===true, complex multi-value:
  //  { name: "John,Jane", other: "1,2" } --> every combination that matches
  // NOTE: this data (John/1, Jane/2) does not yet distinguish a true cross-product
  // from a positional zip of the two columns — both yield {John, Jane}. Pinning the
  // cross-product semantics precisely needs an extra record (e.g. John/2) that only
  // the cross-product would touch. Whether unrelated cross-pairs *should* be linked
  // is an open design question for the import UX, so it is deliberately left loose.
  it("links all matching combinations of multi-value cells (isArray=true)", async () => {
    const john = TestEntity.create({ name: "John", other: "1" });
    const jane = TestEntity.create({ name: "Jane", other: "2" });
    await entityMapper.saveAll([john, jane]);

    const result = await runImport({ name: "John,Jane", other: "1,2" }, [
      { column: "name", propertyName: "arrayRef", additional: "name" },
      { column: "other", propertyName: "arrayRef", additional: "other" },
    ]);

    // (John,1) and (Jane,2) match; (John,2) and (Jane,1) do not
    expect(result?.arrayRef).toEqual(
      expect.arrayContaining([john.getId(), jane.getId()]),
    );
    expect(result?.arrayRef).toHaveLength(2);
  });
});
