import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "../dynamic-form-validators/validator-types";

export function uniqueIdValidator(
  existingIds: string[] | (() => Promise<string[]>),
): AsyncPromiseValidatorFn {
  return async (control: FormControl): Promise<ValidationErrors | null> => {
    if (control.value === control.defaultValue) {
      return null;
    }

    const existingValues = Array.isArray(existingIds)
      ? existingIds
      : await existingIds();
    const value = control.value;

    if (existingValues.some((id) => id === value)) {
      return {
        uniqueId: $localize`:form field validation error:id already in use`,
      };
    }

    return null;
  };
}
