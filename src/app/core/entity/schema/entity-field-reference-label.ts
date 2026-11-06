/**
 * Human-readable references to a field of an entity type, e.g. for the inheritance
 * options in the admin UI or the import actions in the entity context menu.
 * Kept here so that all places referring to such a relation read the same.
 */

/** `field "Linked School"` */
export function fieldReferenceLabel(fieldLabel: string): string {
  return $localize`:reference to a field of a record:field "${fieldLabel}:fieldLabel:"`;
}

/** `School Enrollments > field "Linked School"` */
export function entityToFieldReferenceLabel(
  entityLabel: string,
  fieldLabel: string,
): string {
  return `${entityLabel} > ${fieldReferenceLabel(fieldLabel)}`;
}

/** `field "Linked School" > School` */
export function fieldToEntityReferenceLabel(
  fieldLabel: string,
  entityLabel: string,
): string {
  return `${fieldReferenceLabel(fieldLabel)} > ${entityLabel}`;
}
