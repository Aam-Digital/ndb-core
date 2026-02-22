import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "../dynamic-form-validators/validator-types";

export const UNIQUE_PROPERTY_ERROR_KEY = "uniqueProperty";

export interface UniquePropertyValidatorConfig {
  /**
   * Function to get existing values to compare against
   */
  getExistingValues: () => Promise<string[]>;
  /**
   * Whether to normalize values (trim and lowercase) before comparison
   */
  normalize?: boolean;
  /**
   * Label of the field being validated, used to generate the error message.
   * The error message will be: "A record with this {fieldLabel} already exists."
   */
  fieldLabel: string;
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function isDuplicate(
  currentValue: string,
  existingValues: string[],
  shouldNormalize: boolean,
): boolean {
  if (shouldNormalize) {
    currentValue = normalizeValue(currentValue);
    existingValues = existingValues.map(normalizeValue);
  }

  return existingValues.includes(currentValue);
}

/**
 * Generic validator to ensure a property value is unique within a collection.
 * Can be configured to validate different properties (id, label, etc.) with optional normalization.
 *
 * @param config Configuration object for the validator
 * @returns An async validator function
 */
export function uniquePropertyValidator(
  config: UniquePropertyValidatorConfig,
): AsyncPromiseValidatorFn {
  return async (control: FormControl): Promise<ValidationErrors | null> => {
    if (!control.value || control.value === control.defaultValue) {
      return null;
    }

    const existingValues = await config.getExistingValues();
    const hasDuplicate = isDuplicate(
      control.value,
      existingValues,
      config.normalize ?? false,
    );

    return hasDuplicate
      ? {
          uniqueProperty: $localize`:form field validation error:A record with this ${config.fieldLabel} already exists.`,
        }
      : null;
  };
}
