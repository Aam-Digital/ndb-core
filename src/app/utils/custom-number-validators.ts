import { AbstractControl, ValidatorFn } from "@angular/forms";

/**
 * Container for custom Angular Validator functions.
 */
export const CustomNumberValidators: { isNumber: ValidatorFn } = {
  /**
   * Angular Validator to verify value is a valid number.
   */
  isNumber: (control: AbstractControl) => {
    if (control.value && Number.isNaN(Number(control.value))) {
      return { isNumber: "invalid" };
    } else {
      return null;
    }
  },
};
