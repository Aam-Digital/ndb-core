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
 * @param addIfMissing (Optional) whether to add an entity that comes through an update event but is not part of the array yet,
 *                          default is to add, disable this if you do special filtering or calculations on the data
 * @return An array of the given entities with the update applied
 */
export function applyUpdate<T extends Entity>(
  entities: T[],
  next: UpdatedEntity<T>,
  addIfMissing: boolean = true,
): T[] {
  if (!next || !next.entity || !entities) {
    return entities;
  }

  if (
    (next.type === "new" || (addIfMissing && next.type === "update")) &&
    !entities.find((e) => e.getId() === next.entity.getId())
  ) {
    return [next.entity].concat(entities);
  }

  if (next.type === "update") {
    return entities.map((e) =>
      e.getId() === next.entity.getId() ? next.entity : e,
    );
  }

  if (next.type === "remove") {
    return entities.filter((e) => e.getId() !== next.entity.getId());
  }

  return entities;
}
