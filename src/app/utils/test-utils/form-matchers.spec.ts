import { AbstractControl } from "@angular/forms";
import { makeCustomMatcher } from "./custom-matcher-utils";

export const formMatchers: jasmine.CustomMatcherFactories = {
  toContainFormError: (util) => {
    return makeCustomMatcher(
      (form: AbstractControl, expectedError: string) =>
        form.hasError(expectedError),
      (form: AbstractControl, expectedError: string) =>
        `Expected form ${util.pp(
          form.value
        )} to contain error ${expectedError}`,
      (form: AbstractControl, expectedError: string) =>
        `Expected form ${util.pp(
          form.value
        )} not to contain error ${expectedError}`
    );
  },
  toHaveValue: (util) => {
    return makeCustomMatcher(
      (form: AbstractControl, expected: any) =>
        util.equals(form.value, expected),
      (form, expected) =>
        `Form ${util.pp(form.value)} does not contain value ${expected}`,
      (form, expected) =>
        `Form ${util.pp(form.value)} unexpectedly contains value ${expected}`
    );
  },
  toBeValidForm: (util) => {
    return makeCustomMatcher(
      (form: AbstractControl) => form.valid,
      (form) => `Expected form ${util.pp(form.value)} to be valid`,
      (form) => `Expected form ${util.pp(form.value)} not to be valid`
    );
  },
  toBeEnabled: (util) => {
    return makeCustomMatcher(
      (form: AbstractControl) => form.enabled,
      (form) => `Expected form ${util.pp(form.value)} to be enabled`,
      (form) => `Expected form ${util.pp(form.value)} not to be enabled`
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(formMatchers);
});
