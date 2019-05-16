import {Entity} from './entity';

export function dbClass(entityType) {
  return (constructor) => {
    constructor.ENTITY_TYPE = entityType;
    // Use the dummy object to extend the schema
    constructor.schema = Entity.schema.extend(constructor.localSchema);
    delete constructor.localSchema;
    console.log('constructor', constructor)
  }
}

// Property decorators are called before class decorators
export function dbProperty(schemaLine) {
  return (target, property) => {
    // Adding a dummy object to store the schemas
    if (!target.constructor.hasOwnProperty('localSchema')) {
      target.constructor.localSchema = {};
    }
    target.constructor.localSchema[property] = schemaLine;
    return target;
  }
}
