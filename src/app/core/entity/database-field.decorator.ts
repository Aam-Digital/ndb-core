import 'reflect-metadata';
import {EntitySchemaField} from './schema/entity-schema-field';

/**
 * Decorator (Annotation `@DatabaseField()`) to mark a property of an Entity that should be persisted in the database.
 * @param propertySchema (optional) SchemaField definition that configures additional options regarding this field
 */
export function DatabaseField(propertySchema: EntitySchemaField = {}) {
  return (target, propertyName: string) => {
    target[propertyName] = undefined; // This ensures that the field is not read only

    if (propertySchema.dataType === undefined) {
      propertySchema.dataType = Reflect.getMetadata('design:type', target, propertyName).name.toLowerCase();
    }

    if (Object.getOwnPropertyDescriptor(target.constructor, 'schema') == null) {
      target.constructor.schema = new Map<string, EntitySchemaField>();
    }
    target.constructor.schema.set(propertyName, propertySchema);

    return target;
  };
}
