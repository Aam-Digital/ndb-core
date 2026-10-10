import { EntitySchemaField } from "./entity-schema-field";

/**
 * From a field's `additional` embedded schema, return the entries
 * whose `dataType` is `"entity"` (i.e. inner entity-reference properties).
 *
 * Returns an empty array when the field has no embedded schema.
 *
 * This is shared between the in-memory check which fields of a record reference an
 * entity (see {@link EntityRelationsService}) and the database query selecting
 * candidate records (see {@link DefaultDatatype.getReferenceSelector}), so that the
 * two cannot disagree about which inner properties hold a reference.
 */
export function getInnerEntityReferenceFields(
  field?: EntitySchemaField,
): [string, EntitySchemaField][] {
  if (
    !field?.additional ||
    typeof field.additional !== "object" ||
    Array.isArray(field.additional)
  ) {
    return [];
  }
  return Object.entries(
    field.additional as Record<string, EntitySchemaField>,
  ).filter(([, inner]) => inner.dataType === "entity");
}
