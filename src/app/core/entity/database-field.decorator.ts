import "reflect-metadata";
import { EntitySchemaField } from "./schema/entity-schema-field";

/**
 * Decorator (Annotation `@DatabaseField()`) to mark a property of an Entity that should be persisted in the database.
 *
 * also see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 *
 * @param propertySchema (optional) SchemaField definition that configures additional options regarding this field
 */
export function DatabaseField(propertySchema: EntitySchemaField = {}) {
  return (target, propertyName: string) => {
    // Retrieve datatype from TypeScript type definition
    if (propertySchema.dataType === undefined) {
      const type = Reflect.getMetadata("design:type", target, propertyName);
      propertySchema.dataType = type.DATA_TYPE ?? type.name.toLowerCase();
    }
    addPropertySchema(target, propertyName, propertySchema);
  };
}

export function addPropertySchema(
  target,
  propertyName: string,
  propertySchema: EntitySchemaField
) {
  target[propertyName] = undefined; // This ensures that the field is not read only

  if (Object.getOwnPropertyDescriptor(target.constructor, "schema") == null) {
    target.constructor.schema = new Map<string, EntitySchemaField>();
  }
  target.constructor.schema.set(propertyName, propertySchema);

  return target;
}
