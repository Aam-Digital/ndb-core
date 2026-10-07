import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";

/**
 * Special default value config inherit a field from a related entity (source)
 * and keep it updated on this (target) entity.
 */
export interface DefaultValueConfigInheritedField {
  /**
   * EntityType of the related source entity from which the value is inherited from
   *
   * If not defined, the source entity is identified by a field on this (target) entity.
   */
  sourceReferenceEntity?: string;

  /**
   * field ID that holds the reference to the source (parent) entity's ID.
   * This field is either on the current (target) entity (if sourceReferenceEntity is undefined)
   * or on the related entity defined by sourceReferenceEntity.
   *
   * e.g. if a child's field should be updated based on a school's value then
   * this is the field on the school entity of type "entity", holding the child's entity for the relevant relation
   * and the sourceReferenceEntity is "school".
   */
  sourceReferenceField: string;

  /**
   * field ID of the relatedEntity which triggers updates of this value
   */
  sourceValueField: string;

  /**
   * Optional Key-Value map defining "when-then" rules to update the value, where
   * keys are values of the relatedEntity's relatedSourceField and
   * mapped values are the new values of this field that get updated automatically.
   *
   * If not defined, the value is copied unchanged.
   */
  valueMapping?: { [key: string]: string };

  /**
   * How the new value is applied to this field:
   * - "replace" (default): overwrite the existing value
   * - "add": for fields allowing multiple values (isArray) only,
   *   add new values to the existing ones (skipping duplicates) and never remove any
   */
  aggregation?: "replace" | "add";
}

/**
 * Whether the field collects the values of all related records that link to this record
 * (e.g. a school's field collecting the cities of all its children),
 * adding to the existing values instead of replacing them.
 */
export function isCollectingFromLinkedRecords(
  field: EntitySchemaField | undefined,
): boolean {
  const config: DefaultValueConfigInheritedField = field?.defaultValue?.config;
  return (
    field?.defaultValue?.mode === "inherited-field" &&
    !!field.isArray &&
    !!config?.sourceReferenceEntity &&
    config.aggregation === "add"
  );
}
