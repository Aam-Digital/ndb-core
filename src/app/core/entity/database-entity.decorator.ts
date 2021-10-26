/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 *
 * also see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 *
 * @param entityType The string key for this Entity Type, used as id prefix.
 */
import { DynamicEntityService } from "./dynamic-entity.service";

export function DatabaseEntity(entityType: string) {
  return (constructor) => {
    DynamicEntityService.registerNewEntity(entityType, constructor);
    constructor.ENTITY_TYPE = entityType;

    // append parent schema definitions
    const parentConstructor = Object.getPrototypeOf(constructor);
    parentConstructor.schema.forEach((value, key) =>
      constructor.schema.set(key, value)
    );
  };
}
