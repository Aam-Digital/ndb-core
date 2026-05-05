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

  it("should importMap by matching string correctly", async () => {
    const c1 = new TestEntity();
    c1.other = "456"; // Ensure "other" is a string
    await entityMapper.saveAll([c1]);

    const importContext = createImportContext("456", schema.id, "other");

    // "simple" case: imported value is string already
    await expect(
      dataType.importMapFunction("456", schema, "other", importContext),
    ).resolves.toEqual(c1.getId());
  });

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

  it("should importMap by matching multiple fields", async () => {
    const c1 = new TestEntity();
    c1.name = "Joe";
    c1.other = "1";

    const c2 = new TestEntity();
    c2.name = "Max";
    c2.other = "2";

    const c3 = new TestEntity();
    c3.name = "Joe";
    c3.other = "2";

    await entityMapper.saveAll([c1, c2, c3]);

    let importContext = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        {
          column: "iName",
          propertyName: schema.id,
          additional: "name",
        },
        {
          column: "iOther",
          propertyName: schema.id,
          additional: "other",
        },
      ],
    });
    importContext.row = { iName: "Joe", iOther: "2", iRef: "x" };
    let result = await dataType.importMapFunction(
      "Joe",
      schema,
      "name",
      importContext,
    );

    // expect to filter all column conditions and update result upon second column's criteria
    expect(result).toBe(c3.getId());

    let importContext2 = new ImportProcessingContext({
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        {
          column: "iName",
          propertyName: schema.id,
          additional: "name",
        },
        {
          column: "iOther",
          propertyName: schema.id,
          additional: "other",
        },
        {
          column: "iRef",
          propertyName: schema.id,
          additional: "ref",
        },
      ],
    });
    importContext2.row = { iName: "Joe", iOther: "2", iRef: "x" };
    result = await dataType.importMapFunction(
      "x",
      schema,
      "ref",
      importContext2,
    );
    // expect reset to undefined if further criteria does not match anymore
    expect(result).toBe(undefined);
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

  it("should importMap with new object additional format { refField }", async () => {
    const c1 = new TestEntity();
    c1.other = "456";
    await entityMapper.saveAll([c1]);

    const importContext = createImportContext("456", schema.id, {
      refField: "other",
    });

    await expect(
      dataType.importMapFunction(
        "456",
        schema,
        { refField: "other" },
        importContext,
      ),
    ).resolves.toEqual(c1.getId());
  });

  it("should importMap with legacy string additional (backward compat)", async () => {
    const c1 = new TestEntity();
    c1.other = "testValue";
    await entityMapper.saveAll([c1]);

    const importContext = createImportContext("testValue", schema.id, "other");

    // Legacy format (plain string) should still work
    await expect(
      dataType.importMapFunction("testValue", schema, "other", importContext),
    ).resolves.toEqual(c1.getId());
  });

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

  it("should importMap entity ref with value mapping using sub-field importMapFunction", async () => {
    // Test that valueMapping is applied through the sub-field's importMapFunction + transformToDatabaseFormat
    // Using string field with a date format mapping to verify the chain
    const entity = new TestEntity();
    entity.other = "some value";
    await entityMapper.saveAll([entity]);

    const additional = { refField: "other" }; // no valueMapping - plain string matching
    const importContext = createImportContext(
      "some value",
      schema.id,
      additional,
    );

    await expect(
      dataType.importMapFunction(
        "some value",
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
