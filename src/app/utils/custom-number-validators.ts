import { AbstractControl, ValidatorFn } from "@angular/forms";

/**
 * Container for custom Angular Validator functions.
 */
export const CustomNumberValidators: { isNumber: ValidatorFn } = {
  /**
   * Angular Validator to verify value is a valid number.
   */
  isNumber: (control: AbstractControl) => {
    const val = Number(control.value);

    if (val && Number.isNaN(Number(val))) {
      return { isNumber: "invalid" };
    } else {
      return null;
    }
  },
};
