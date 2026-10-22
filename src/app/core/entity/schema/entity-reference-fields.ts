import { EntitySchema } from "./entity-schema";
import { EntitySchemaField } from "./entity-schema-field";

/**
 * From the inner schema of an embedded field, return the entries
 * whose `dataType` is `"entity"` (i.e. inner entity-reference properties).
 *
 * Returns an empty array when there is no inner schema.
 *
 * This is shared between the in-memory check which fields of a record reference an
 * entity (see {@link EntityRelationsService}) and the database query selecting
 * candidate records (see {@link DefaultDatatype.getReferenceSelector}), so that the
 * two cannot disagree about which inner properties hold a reference.
 * To resolve the inner schema of a field, use {@link getEmbeddedEntityReferenceFields}.
 */
export function getInnerEntityReferenceFields(
  innerSchema: EntitySchema | undefined,
): [string, EntitySchemaField][] {
  return [...(innerSchema ?? [])].filter(
    ([, inner]) => inner.dataType === "entity",
  );
}
