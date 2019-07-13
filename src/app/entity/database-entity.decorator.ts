

/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type
 * @param entityType The string key for this Entity Type, used as id prefix.
 */
export function DatabaseEntity(entityType: string) {
  return (constructor) => {
    constructor.ENTITY_TYPE = entityType;

    // append parent schema definitions
    const parentConstructor = Object.getPrototypeOf(constructor);
    parentConstructor.schema.forEach((value, key) => constructor.schema.set(key, value));
  };
}
