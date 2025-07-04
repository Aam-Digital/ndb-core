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
          useValue: jasmine.createSpyObj(["anonymize"]),
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

    // "simple" case: imported value is string already
    await expectAsync(
      dataType.importMapFunction(
        "456",
        schema,
        "other",
        new ImportProcessingContext(),
      ),
    ).toBeResolvedTo(c1.getId());
  });

  it("should importMap by matching numeric value correctly", async () => {
    const c2 = new TestEntity();
    c2.other = "456"; // Ensure "other" is a string
    await entityMapper.saveAll([c2]);

    // "advanced" case: imported value is number but should match also
    await expectAsync(
      dataType.importMapFunction(
        456,
        schema,
        "other",
        new ImportProcessingContext(),
      ),
    ).toBeResolvedTo(c2.getId());
  });

  it("should importMap by matching multiple fields", async () => {
    const context = new ImportProcessingContext();

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

    let result = await dataType.importMapFunction(
      "Joe",
      schema,
      "name",
      context,
    );
    // expect initial match immediately
    expect(result).toBe(c1.getId());

    result = await dataType.importMapFunction("2", schema, "other", context);
    // expect to filter further and update result upon second column's criteria
    expect(result).toBe(c3.getId());

    result = await dataType.importMapFunction("x", schema, "ref", context);
    // expect reset to undefined if further criteria does not match anymore
    expect(result).toBe(undefined);
  });

  it("should anonymize entity recursively", async () => {
    const referencedEntity = new TestEntity("ref-1");
    referencedEntity.name = "test";

    await entityMapper.saveAll([referencedEntity]);
    spyOn(entityMapper, "save");
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
});
