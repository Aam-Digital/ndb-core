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
 * Updates a list of entities given an updated version of the entity. This updated version
 * can either be a new entity (that should be inserted into the list), or an existing entity
 * that should be updated or deleted.
 * The given array will not be mutated but will be returned when the given new entity
 * or type is illegal
 * @param next An entity that should be updated as well as the type of update. This, as well as the entity
 * may be undefined or null. In this event, the entities-array is returned as is.
 * @param entities The entities to update, must be defined
 * @return An array of the given entities with the update applied
 */
export function update<T extends Entity>(
  entities: T[],
  next: UpdatedEntity<T>
) {
  if (!next || !next.entity) {
    return entities;
  }
  switch (next.type) {
    case "new":
      return [next.entity].concat(entities);
    case "update":
      return entities.map((e) =>
        e.getId() === next.entity.getId() ? next.entity : e
      );
    case "remove":
      return entities.filter((e) => e.getId() !== next.entity.getId());
  }
}
