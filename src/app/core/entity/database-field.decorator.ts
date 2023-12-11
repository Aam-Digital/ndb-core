import "reflect-metadata";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { EntitySchema } from "./schema/entity-schema";

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
      const typeName = type.DATA_TYPE ?? type.name.toLowerCase();
      // 'object' type is ignored
      if (typeName !== "object") {
        propertySchema.dataType = typeName;
      }
    }
    addPropertySchema(target, propertyName, propertySchema);
  };
}

export function addPropertySchema(
  target,
  propertyName: string,
  propertySchema: EntitySchemaField,
) {
  target[propertyName] = undefined; // This ensures that the field is not read only
  getEntitySchema(target.constructor).set(propertyName, propertySchema);
  return target;
}

/**
 * Returns the schema map of this entity (not the superclass).
 * Creates and assigns a new one if it doesn't exist yet.
 * @param ctor
 */
export function getEntitySchema(ctor): EntitySchema {
  if (Object.getOwnPropertyDescriptor(ctor, "schema") == null) {
    ctor.schema = new Map<string, EntitySchemaField>();
  }
  return ctor.schema;
}
