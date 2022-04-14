import { AbstractControl } from "@angular/forms";

export const formMatchers: jasmine.CustomMatcherFactories = {
  toContainFormError: (util) => {
    return {
      compare: (form: AbstractControl, expectedError: string) => {
        const result = { pass: false, message: "" };
        if (form.hasError(expectedError)) {
          result.pass = true;
        } else {
          result.message = `Expected form ${util.pp(
            form.value
          )} to contain error ${expectedError}`;
        }
        return result;
      },
      negativeCompare: (form: AbstractControl, expectedError: string) => {
        const result = { pass: false, message: "" };
        if (!form.hasError(expectedError)) {
          result.pass = true;
        } else {
          result.message = `Expected form ${util.pp(
            form.value
          )} not to contain error ${expectedError}`;
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
      negativeCompare: (form: AbstractControl, expected: any) => {
        const result = { pass: false, message: "" };
        if (!util.equals(form.value, expected)) {
          result.pass = true;
        } else {
          result.message = `Form unexpectedly contains value ${expected}`;
        }
        return result;
      },
    };
  },
  toBeValidForm: (util) => {
    return {
      compare: (form: AbstractControl) => {
        const result = { pass: false, message: "" };
        if (form.valid) {
          result.pass = true;
        } else {
          result.message = `Expected form ${util.pp(form.value)} to be valid`;
        }
        return result;
      },
      negativeCompare: (form: AbstractControl) => {
        const result = { pass: false, message: "" };
        if (!form.valid) {
          result.pass = true;
        } else {
          result.message = `Expected form ${util.pp(
            form.value
          )} not to be valid`;
        }
        return result;
      },
    };
  },
  toBeEnabled: () => {
    return {
      compare: (form: AbstractControl) => {
        const result = { pass: false, message: "" };
        if (form.enabled) {
          result.pass = true;
        } else {
          result.message = "Expected form to be enabled";
        }
        return result;
      },
      negativeCompare: (form: AbstractControl) => {
        const result = { pass: false, message: "" };
        if (!form.enabled) {
          result.pass = true;
        } else {
          result.message = "Expected form not to be enabled";
        }
        return result;
      },
    };
  },
};

beforeAll(() => {
  jasmine.addMatchers(formMatchers);
});
