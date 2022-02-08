/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 *
 * also see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 *
 * @param entityType The string key for this Entity Type, used as id prefix.
 */
import { DynamicRegistry } from "../registry/DynamicRegistry";

export function DatabaseEntity(entityType: string) {
  return (constructor) => {
    DynamicRegistry.ENTITY.add(entityType, constructor);
    constructor.ENTITY_TYPE = entityType;

    // append parent schema definitions
    const parentConstructor = Object.getPrototypeOf(constructor);
    parentConstructor.schema.forEach((value, key) =>
      constructor.schema.set(key, value)
    );
  };
}
