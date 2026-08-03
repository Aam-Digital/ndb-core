import { Provider } from "@angular/core";
import { fakeAsync, TestBed, waitForAsync } from "@angular/core/testing";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { Entity, EntityConstructor } from "./entity";

/**
 * Shared entity subclass test cases for model classes extending Entity.
 *
 * @param additionalProviders the datatypes (and their dependencies) used by the entity's schema.
 *   Provide the individual `DefaultDatatype` implementations rather than a module, so the spec
 *   does not boot the whole AppModule - see #4192.
 */
export function testEntitySubclass(
  entityType: string,
  entityClass: EntityConstructor,
  expectedDatabaseFormat: any,
  skipTestbedConfiguration = false,
  additionalProviders: Provider[] = [],
) {
  let schemaService: EntitySchemaService;
  beforeEach(waitForAsync(() => {
    if (!skipTestbedConfiguration) {
      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          // a base entry so the `DefaultDatatype` multi-token always resolves, even for
          // an entity whose schema needs no specific datatype at all
          { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
          ...additionalProviders,
        ],
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
