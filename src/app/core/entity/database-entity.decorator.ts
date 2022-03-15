import { Entity, EntityConstructor } from "./model/entity";
import { InjectionToken } from "@angular/core";
import { Registry } from "../registry/dynamic-registry";

export type EntityRegistry = Registry<EntityConstructor>;
export const ENTITIES = new InjectionToken<EntityRegistry>(
  "app.registries.entities"
);
export const entityRegistry = new Registry<EntityConstructor>(
  (key, constructor) => {
    if (!(new constructor() instanceof Entity)) {
      throw Error(
        `Tried to register an entity-type that is not a subclass of Entity\n` +
          `type: ${key}; constructor: ${constructor}`
      );
    }
  }
);

/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
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
    parentConstructor.schema.forEach((value, key) =>
      constructor.schema.set(key, value)
    );
  };
}
