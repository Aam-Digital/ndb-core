import { Entity, EntityConstructor } from "./model/entity";
import { Registry } from "../config/registry/dynamic-registry";
import { getEntitySchema } from "./database-field.decorator";

export class EntityRegistry extends Registry<EntityConstructor> {
  /**
   * Get an array of entity types, optionally filtered to exclude internal, administrative types.
   * @param onlyUserFacing Whether to only include types that are explicitly defined and customized in the config, from which we infer they are user-facing.
   */
  getEntityTypes(
    onlyUserFacing = false,
  ): { key: string; value: EntityConstructor }[] {
    let entities = Array.from(this.entries()).map(([key, value]) => ({
      key,
      value,
    }));
    if (onlyUserFacing) {
      entities = entities.filter(({ key, value }) => value._isCustomizedType);
    }
    return entities;
  }
}

export const entityRegistry = new EntityRegistry((key, constructor) => {
  if (!(new constructor() instanceof Entity)) {
    throw Error(
      `Tried to register an entity-type that is not a subclass of Entity\n` +
        `type: ${key}; constructor: ${constructor}`,
    );
  }
});

/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 * The entity should also be added to the {@link databaseEntities} array of the surrounding module.
 *
 * also see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 *
 * @param entityType The string key for this Entity Type, used as id prefix.
 */
export function DatabaseEntity(entityType: string) {
  return (constructor) => {
    entityRegistry.add(entityType, constructor);
    constructor.ENTITY_TYPE = entityType;

    // append parent schema definitions
    const parentConstructor = Object.getPrototypeOf(constructor);
    const schema = getEntitySchema(constructor);
    parentConstructor.schema.forEach((value, key) => schema.set(key, value));
  };
}
