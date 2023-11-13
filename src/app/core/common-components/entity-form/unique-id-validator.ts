import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function uniqueIdValidator(existingIds: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (existingIds.some((id) => id === value)) {
      return {
        uniqueId: $localize`:form field validation error:id already in use`,
      };
    }

    return null;
  };
}
