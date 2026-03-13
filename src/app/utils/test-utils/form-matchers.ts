import { AbstractControl } from "@angular/forms";

type MatcherResult = { pass: boolean; message: () => string };
type MatcherContext = {
  equals?: (a: unknown, b: unknown) => boolean;
  utils?: { printReceived?: (value: unknown) => string };
};

function pp(context: MatcherContext, value: unknown): string {
  if (context.utils?.printReceived) {
    return context.utils.printReceived(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const formMatchers = {
  toContainFormError(
    this: MatcherContext,
    form: AbstractControl,
    expectedError: string,
  ): MatcherResult {
    const pass = form.hasError(expectedError);

    return {
      pass,
      message: () =>
        pass
          ? `Expected form ${pp(this, form.value)} not to contain error ${expectedError}`
          : `Expected form ${pp(this, form.value)} to contain error ${expectedError}`,
    };
  },

  toHaveValue(
    this: MatcherContext,
    form: AbstractControl,
    expected: unknown,
  ): MatcherResult {
    const equals = this.equals ?? Object.is;
    const pass = equals(form.value, expected);

    return {
      pass,
      message: () =>
        pass
          ? `Form ${pp(this, form.value)} unexpectedly contains value ${pp(this, expected)}`
          : `Form ${pp(this, form.value)} does not contain value ${pp(this, expected)}`,
    };
  },

  toBeValidForm(this: MatcherContext, form: AbstractControl): MatcherResult {
    const pass = form.valid;

    return {
      pass,
      message: () =>
        pass
          ? `Expected form ${pp(this, form.value)} not to be valid`
          : `Expected form ${pp(this, form.value)} to be valid`,
    };
  },

  toBeEnabled(this: MatcherContext, form: AbstractControl): MatcherResult {
    const pass = form.enabled;

    return {
      pass,
      message: () =>
        pass
          ? `Expected form ${pp(this, form.value)} not to be enabled`
          : `Expected form ${pp(this, form.value)} to be enabled`,
    };
  },
};
