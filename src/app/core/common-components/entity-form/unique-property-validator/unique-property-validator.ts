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

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function isDuplicate(
  currentValue: string,
  existingValues: string[],
  excludeValue: string | undefined,
  shouldNormalize: boolean,
): boolean {
  const normalizedCurrent = shouldNormalize
    ? normalizeValue(currentValue)
    : currentValue;
  const normalizedExclude =
    excludeValue !== undefined && shouldNormalize
      ? normalizeValue(excludeValue)
      : excludeValue;

  return existingValues.some((existing) => {
    const normalizedExisting = shouldNormalize
      ? normalizeValue(existing)
      : existing;
    if (
      normalizedExclude !== undefined &&
      normalizedExisting === normalizedExclude
    ) {
      return false;
    }
    return normalizedExisting === normalizedCurrent;
  });
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
      config.excludeValue,
      config.normalize ?? false,
    );

    return hasDuplicate ? { [config.errorKey]: config.errorMessage } : null;
  };
}
