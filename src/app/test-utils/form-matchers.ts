import { AbstractControl } from "@angular/forms";

export const formMatchers: jasmine.CustomMatcherFactories = {
  toContainFormError: () => {
    return {
      compare: (form: AbstractControl, expectedError: string) => {
        const result = { pass: false, message: "" };
        if (form.hasError(expectedError)) {
          result.pass = true;
        } else {
          result.message = "Expected form to contain error";
        }
        return result;
      },
    };
  },
  toHaveValue: (util) => {
    return {
      compare: (form: AbstractControl, expected: any) => {
        const result = { pass: false, message: "" };
        if (util.equals(form.value, expected)) {
          result.pass = true;
        } else {
          result.message = "Form does not contain value " + expected;
        }
        return result;
      },
    };
  },
  toBeValidForm: () => {
    return {
      compare: (form: AbstractControl) => {
        const result = { pass: false, message: "" };
        if (form.valid) {
          result.pass = true;
        } else {
          result.message = "Expected form to be valid";
        }
        return result;
      },
    };
  },
};
