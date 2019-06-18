import {Entity} from './entity';

/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type
 * @param entityType The string key for this Entity Type, used as id prefix.
 */
export function DatabaseEntity(entityType: string) {
  return (constructor) => {
    constructor.ENTITY_TYPE = entityType;
    // Use the dummy object to extend the schema // TODO: document why "localSchema" is needed
    constructor.schema = Entity.schema.extend(constructor.localSchema);
    delete constructor.localSchema;
    console.log('constructor', constructor)
  };
}
