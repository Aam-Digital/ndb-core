import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "../dynamic-form-validators/validator-types";
import { EntityConstructor } from "../../../entity/model/entity";

/**
 * Validator to ensure that a field label is unique within an entity type's schema.
 * Labels are compared case-insensitively with trimmed whitespace.
 *
 * @param entityType The entity type whose schema contains all field labels
 * @param currentFieldId Optional ID of the field being edited (to exclude it from comparison)
 * @returns An async validator function
 */
export function uniqueLabelValidator(
  entityType: EntityConstructor,
  currentFieldId?: string,
): AsyncPromiseValidatorFn {
  return async (control: FormControl): Promise<ValidationErrors | null> => {
    // Allow unchanged values (for editing existing fields)
    if (!control.value || control.value === control.defaultValue) {
      return null;
    }

    const normalizedLabel = control.value.trim().toLowerCase();

    // Check all fields in the entity schema
    for (const [fieldId, field] of entityType.schema.entries()) {
      // Skip comparing with the current field being edited
      if (fieldId === currentFieldId) {
        continue;
      }

      const existingLabel = field.label?.trim().toLowerCase();
      if (existingLabel === normalizedLabel) {
        return {
          duplicateLabel: $localize`:form field validation error:A field with this label already exists`,
        };
      }
    }

    return null;
  };
}
