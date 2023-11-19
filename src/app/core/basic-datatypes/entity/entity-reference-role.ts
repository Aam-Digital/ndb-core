/**
 * Specifies the role of an entity reference where
 *    "aggregate" = "has a" relationship where both entities have meaning independent of each other;
 *    "composite" = "part of" relationship where the referenced entity should not exist without the referenced entity.
 *
 * Default is treated as "aggregate".
 *
 * (role names following the UML association types)
 */
export type EntityReferenceRole = "aggregate" | "composite";
