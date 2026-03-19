import { fakeAsync, TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { Entity, EntityConstructor } from "./entity";

/**
 * Shared entity subclass test cases for model classes extending Entity.
 */
export function testEntitySubclass(
  entityType: string,
  entityClass: EntityConstructor,
  expectedDatabaseFormat: any,
  skipTestbedConfiguration = false,
) {
  let schemaService: EntitySchemaService;
  beforeEach(waitForAsync(() => {
    if (!skipTestbedConfiguration) {
      TestBed.configureTestingModule({
        imports: [MockedTestingModule.withState()],
      });
    }
    schemaService = TestBed.inject(EntitySchemaService);
  }));

  it("should be a valid entity subclass", () => {
    const id = "test1";
    const entity = new entityClass(id);

    // correct ID
    expect(entity.getId()).toEqual(`${entityType}:${id}`);
    expect(Entity.extractEntityIdFromId(entity.getId())).toBe(id);

    // correct Type
    expect(entity).toBeInstanceOf(entityClass);
    expect(entity).toBeInstanceOf(Entity);
    expect(entity.getType()).toBe(entityType);
    // @ts-ignore
    expect(Entity.extractTypeFromId(entity._id)).toBe(entityType);
  });

  it("should only load and store properties defined in the schema", fakeAsync(() => {
    const entity = new entityClass();

    schemaService.loadDataIntoEntity(
      entity,
      JSON.parse(JSON.stringify(expectedDatabaseFormat)),
    );
    const rawData = schemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData).toEqual(expectedDatabaseFormat);
  }));
}
