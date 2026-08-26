/**
 * Specifies the role of an entity reference, seen from the entity containing the field, where
 *    "aggregate" = "has a" relationship where both entities have meaning independent of each other;
 *    "composite" = "part of" relationship where the entity containing this field should not exist
 *                  without the referenced entity, so that deleting or anonymizing the referenced
 *                  entity cascades to the entity containing this field.
 *
 * Default is treated as "aggregate".
 *
 * (role names following the UML association types)
 */
export type EntityReferenceRole = "aggregate" | "composite";
