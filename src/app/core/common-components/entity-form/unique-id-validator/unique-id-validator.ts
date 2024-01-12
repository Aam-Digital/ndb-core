import { FormControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function uniqueIdValidator(
  existingIds: string[] | (() => Promise<string[]>),
): ValidatorFn {
  return async (control: FormControl): Promise<ValidationErrors | null> => {
    if (control.pristine && !!control.value) {
      // (control.value === control.defaultValue) // doesn't work as defaultValue unfortunately is not set properly somehow

      // always allow the existing id, if unchanged
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
