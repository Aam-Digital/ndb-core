import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "../dynamic-form-validators/validator-types";
import { resolveLocaleText } from "../../../language/active-locale";

export const UNIQUE_PROPERTY_ERROR_KEY = "uniqueProperty";

export interface UniquePropertyValidatorConfig {
  /**
   * Function to get existing values to compare against
   */
  getExistingValues: () => Promise<unknown[]>;
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

function normalizeValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase();
}

/**
 * A multi-lingual text is a per-language map, which no two maps compare equal as.
 * Compare the text of the active language instead, i.e. what the admin actually sees.
 * Anything that is not such a map is returned unchanged.
 */
function comparableValue(value: unknown, shouldNormalize: boolean): unknown {
  const resolved = resolveLocaleText(value);
  return shouldNormalize ? normalizeValue(resolved) : resolved;
}

function isDuplicate(
  currentValue: unknown,
  existingValues: unknown[],
  shouldNormalize: boolean,
): boolean {
  return existingValues
    .map((value) => comparableValue(value, shouldNormalize))
    .includes(comparableValue(currentValue, shouldNormalize));
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
    const isEmptyValue =
      control.value === null ||
      control.value === undefined ||
      control.value === "";
    if (isEmptyValue || control.value === control.defaultValue) {
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
