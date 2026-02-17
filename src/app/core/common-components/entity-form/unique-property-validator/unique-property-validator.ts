import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "../dynamic-form-validators/validator-types";

export interface UniquePropertyValidatorConfig {
  /**
   * Function to get existing values to compare against
   */
  getExistingValues: () => Promise<string[]>;
  /**
   * Optional value to exclude from comparison (e.g., when editing an existing field)
   */
  excludeValue?: string;
  /**
   * Whether to normalize values (trim and lowercase) before comparison
   */
  normalize?: boolean;
  /**
   * Custom error key for validation message
   */
  errorKey: string;
  /**
   * Error message to display
   */
  errorMessage: string;
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
    // Skip validation for empty values
    if (!control.value) {
      return null;
    }

    // Skip validation for default/unchanged values (allow editing existing entities)
    if (control.value === control.defaultValue) {
      return null;
    }

    const existingValues = await config.getExistingValues();
    let currentValue = control.value;

    // Apply normalization if configured
    if (config.normalize) {
      currentValue = currentValue.trim().toLowerCase();
    }

    // Normalize excludeValue if needed
    let normalizedExcludeValue: string | undefined;
    if (config.excludeValue !== undefined) {
      normalizedExcludeValue = config.normalize
        ? config.excludeValue.trim().toLowerCase()
        : config.excludeValue;
    }

    // Check for duplicates
    for (const existingValue of existingValues) {
      let compareValue = existingValue;

      // Apply normalization to existing value if configured
      if (config.normalize) {
        compareValue = existingValue.trim().toLowerCase();
      }

      // Skip the excluded value (used when editing existing items)
      if (
        normalizedExcludeValue !== undefined &&
        compareValue === normalizedExcludeValue
      ) {
        continue;
      }

      if (compareValue === currentValue) {
        return {
          [config.errorKey]: config.errorMessage,
        };
      }
    }

    return null;
  };
}
