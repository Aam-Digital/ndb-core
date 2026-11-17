import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";

/**
 * Whether a field can define a hierarchy of records of this type:
 * a link to one other record of the same type (not multiple values).
 */
export function isHierarchyField(
  entityType: EntityConstructor | undefined,
  fieldId: string,
): boolean {
  const field = entityType?.schema.get(fieldId);
  return !!field && linksToOneOfType(field, entityType!.ENTITY_TYPE);
}

function linksToOneOfType(field: EntitySchemaField, type: string): boolean {
  if (field.dataType !== EntityDatatype.dataType || field.isArray) {
    return false;
  }
  const targets = Array.isArray(field.additional)
    ? field.additional
    : [field.additional];
  return targets.length === 1 && targets[0] === type;
}

/** All fields of the type that can define a hierarchy, see {@link isHierarchyField}. */
export function getHierarchyFieldCandidates(
  entityType: EntityConstructor | undefined,
): string[] {
  if (!entityType) {
    return [];
  }
  return [...entityType.schema.keys()].filter((fieldId) =>
    isHierarchyField(entityType, fieldId),
  );
}
