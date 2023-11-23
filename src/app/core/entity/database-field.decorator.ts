import "reflect-metadata";
import { EntitySchemaField } from "./schema/entity-schema-field";

/**
 * Decorator (Annotation `@DatabaseField()`) to mark a property of an Entity that should be persisted in the database.
 *
 * also see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 *
 * @param propertySchema (optional) SchemaField definition that configures additional options regarding this field
 */
export function DatabaseField(
  propertySchema: Omit<EntitySchemaField, "id"> = {},
) {
  return (target, propertyName: string) => {
    const schemaField: EntitySchemaField = {
      id: propertyName,
      ...propertySchema,
    };
    // Retrieve datatype from TypeScript type definition
    if (schemaField.dataType === undefined) {
      const type = Reflect.getMetadata("design:type", target, propertyName);
      const typeName = type.DATA_TYPE ?? type.name.toLowerCase();
      // 'object' type is ignored
      if (typeName !== "object") {
        schemaField.dataType = typeName;
      }
    }
    addPropertySchema(target, schemaField);
  };
}

export function addPropertySchema(target, propertySchema: EntitySchemaField) {
  target[propertySchema.id] = undefined; // This ensures that the field is not read only

  if (Object.getOwnPropertyDescriptor(target.constructor, "schema") == null) {
    target.constructor.schema = new Map<string, EntitySchemaField>();
  }
  target.constructor.schema.set(propertySchema.id, propertySchema);

  return target;
}
