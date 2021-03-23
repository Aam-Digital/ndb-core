import { Entity } from "./entity";

/**
 * Interface that conveys an updated entity as well as information
 * on the update-type
 */

export interface UpdatedEntity<T extends Entity> {
  /**
   * The updated entity
   */
  entity: T;

  /**
   * The type of the update, either:
   * "new" - a new entity was created,
   * "update" - an existing entity was updated
   * "remove" - the entity was deleted
   */

  type: "new" | "update" | "remove";
}

/**
 * Updates a list of entities given a certain updated entity as well as a
 * list of entities that this updated entity could be part of (in the case of
 * an update or remove)
 * @param next An entity that should be updated as well as the type of update
 * @param entities The entities to update
 * @return An array that is a copy of the given entities with the update applied
 */

export function update<T extends Entity>(
  entities: T[],
  next: UpdatedEntity<T>
) {
  if (next) {
    if (next.type === "new") {
      return [next.entity].concat(entities);
    } else {
      const index = entities.findIndex(
        (value) => value.getId() === next.entity.getId()
      );
      if (next.type === "remove" && index !== -1) {
        entities.splice(index, 1);
      } else if (next.type === "update" && index !== -1) {
        entities[index] = next.entity;
        entities = [].concat(entities);
      }
      return entities;
    }
  } else {
    return entities;
  }
}
