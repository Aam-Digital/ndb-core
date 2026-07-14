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
  // direct-call tests kept here cover orthogonal dimensions of importMapFunction
  // that the end-to-end suite does not exercise: value-type coercion, the object
  // `additional` format, valueMapping, per-value array splitting, and the
  // "no unique match -> undefined" contract.

  // Orthogonal: value-type coercion — a numeric import value must still match a
  // string-stored field (normalizeValue coerces both sides to string).
  it("should importMap by matching numeric value correctly", async () => {
    const c2 = new TestEntity();
    c2.other = "456"; // Ensure "other" is a string
    await entityMapper.saveAll([c2]);

    const importContext = createImportContext(456, schema.id, "other");

    // "advanced" case: imported value is number but should match also
    await expect(
      dataType.importMapFunction(456, schema, "other", importContext),
    ).resolves.toEqual(c2.getId());
  });

  // Orthogonal: the "no unique match -> undefined" contract. When multiple mapped
  // columns impose criteria that no single entity satisfies together, the result
  // must be undefined (the positive multi-column narrowing path is covered by the
  // end-to-end "single unique match" case).
  it("should importMap to undefined when mapped columns have no common match", async () => {
    const joe = new TestEntity();
    joe.name = "Joe";
    joe.other = "1";
    const max = new TestEntity();
    max.name = "Max";
    max.other = "2";
    await entityMapper.saveAll([joe, max]);

    const importContext = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "iName", propertyName: schema.id, additional: "name" },
        { column: "iOther", propertyName: schema.id, additional: "other" },
      ],
    });
    // "Joe" exists and "2" exists, but no single entity has both -> no match
    importContext.row = { iName: "Joe", iOther: "2" };

    await expect(
      dataType.importMapFunction("Joe", schema, "name", importContext),
    ).resolves.toBe(undefined);
  });

  // Orthogonal: per-value splitting of a single-column multi-value cell. Distinct
  // from the (still-red) multi-column array cases in the end-to-end block below —
  // this single-column path already works: ImportService splits the cell and calls
  // importMapFunction once per value.
  it("should importMap each split value of a multi-value cell", async () => {
    const joe = new TestEntity();
    joe.name = "Joe";
    const max = new TestEntity();
    max.name = "Max";
    await entityMapper.saveAll([joe, max]);

    // single column mapping into an array field: the cell holds comma-separated
    // names, so import.service splits it and calls importMapFunction per value
    const importContext = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "iRef", propertyName: schema.id, additional: "name" },
      ],
    });
    importContext.row = { iRef: "Joe, Max" };

    await expect(
      dataType.importMapFunction("Joe", schema, "name", importContext),
    ).resolves.toEqual(joe.getId());
    await expect(
      dataType.importMapFunction("Max", schema, "name", importContext),
    ).resolves.toEqual(max.getId());
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
  it("should importMap with both legacy-string and object { refField } additional", async () => {
    const legacy = TestEntity.create({ other: "legacyValue" });
    const object = TestEntity.create({ other: "objectValue" });
    await entityMapper.saveAll([legacy, object]);

    await expect(
      dataType.importMapFunction(
        "legacyValue",
        schema,
        "other",
        createImportContext("legacyValue", schema.id, "other"),
      ),
    ).resolves.toEqual(legacy.getId());

    await expect(
      dataType.importMapFunction(
        "objectValue",
        schema,
        { refField: "other" },
        createImportContext("objectValue", schema.id, { refField: "other" }),
      ),
    ).resolves.toEqual(object.getId());
  });

  // Orthogonal: valueMapping runs the raw import value through the referenced
  // field's own datatype (here a date) before comparing.
  it("should importMap entity ref with date valueMapping", async () => {
    const entity = new TestEntity();
    // Store the date as it would be in DB format (YYYY-MM-DD)
    entity.dateOfBirth = new Date(1990, 4, 1) as any; // May 1, 1990
    await entityMapper.saveAll([entity]);

    const additional = { refField: "dateOfBirth", valueMapping: "DD.MM.YYYY" };
    const importContext = createImportContext(
      "01.05.1990",
      schema.id,
      additional,
    );

    await expect(
      dataType.importMapFunction(
        "01.05.1990",
        schema,
        additional,
        importContext,
      ),
    ).resolves.toEqual(entity.getId());
  });

  function createImportContext(
    value: any,
    fieldId: string,
    additional: any,
  ): ImportProcessingContext {
    const importContext = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        {
          column: "x",
          propertyName: fieldId,
          additional: additional,
        },
      ],
    });
    importContext.row = { x: value };

    return importContext;
  }
});

/**
 * End-to-end coverage of the entity-reference matching cases documented on
 * EntityDatatype.importMapFunction, exercised through the real ImportService so
 * that column splitting and multi-value aggregation (which live in ImportService,
 * not the datatype) are part of the assertion.
 *
 * Target entity has both a single-value (`singleRef`) and an array (`arrayRef`)
 * entity-reference field pointing at TestEntity, so each documented isArray case
 * can be triggered by mapping columns onto the matching field.
 *
 * CURRENT STATUS (TDD) — only the isArray===false / simple case passes today.
 * The other three tests are intentionally RED: they pin the intended behavior
 * documented on importMapFunction that is NOT yet implemented. Root causes:
 *  - Multiple matches for an array field: `pickSingleMatch` returns `undefined`
 *    whenever >1 candidate remains, so a value that matches several records links
 *    none instead of all of them.
 *  - Cross-column value combinations: array cells are split, but only for the
 *    *current* mapped column — every other mapped column is read whole from the
 *    row (importMapFunction, `row[mapping.column]`) and compared by equality, so
 *    combinations across columns never form.
 *  - Non-array multi-value cells are never split at all (ImportService only splits
 *    when `schema.isArray`), so a "x1,x2" cell can't resolve to a single combo.
 * Implementing these requires changing importMapFunction's single-id return
 * contract (to yield multiple ids for array targets) and the split/aggregate
 * logic in ImportService.
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

    // resolve the "ImportTarget" type used only in this spec, while keeping the
    // real registry for the referenced TestEntity type
    const registry = TestBed.inject(EntityRegistry);
    const realGet = registry.get.bind(registry);
    vi.spyOn(registry, "get").mockImplementation((type: string) =>
      type === "ImportTarget" ? (ImportTarget as any) : realGet(type),
    );
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
  // GREEN. Also the canonical happy-path: subsumes the former direct-call tests
  // for basic string matching, multi-column narrowing, and legacy-string
  // `additional` format (`additional: "name"` is the legacy string form).
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
  // RED / not implemented: a non-array cell is never split, so "John,Jane" is
  // compared whole and matches nothing. Needs cell-splitting + combination search
  // that resolves to a single unique match for non-array targets.
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
  // RED / not implemented: `pickSingleMatch` returns undefined for >1 candidate,
  // so two equally-matching records currently link nothing. An array target should
  // instead collect every match.
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
  // RED / not implemented: only the current column is split; the other column is
  // read whole from the row, so no cross-column combination is formed.
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
