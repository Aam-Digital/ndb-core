import { v4 as uuid } from "uuid";
import { Entity } from "../entity/model/entity";
import { entityRegistry } from "../entity/database-entity.decorator";

/**
 * "Simulate" a custom entity type that saves all fields without transformations through a mocked EntitySchema.
 *
 * This is a utility function to help demo data creation
 * because the dynamically migrated config is not ready at the time of demo data generation yet.
 *
 * @param type
 * @param id
 */
export function createEntityOfType(
  type: string,
  id: string = uuid(),
): Entity & { [key: string]: any } {
  const entity = new Entity(id);
  // @ts-ignore
  entity._id = entity._id.replace(Entity.ENTITY_TYPE, type);

  entity.getSchema = () => entityRegistry.get(type).schema;
  entity.getType = () => type;

  return entity;
}
