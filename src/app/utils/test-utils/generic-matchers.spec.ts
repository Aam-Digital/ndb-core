import { makeCustomMatcher } from "./custom-matcher-utils";

const genericMatchers: jasmine.CustomMatcherFactories = {
  toBeEmpty: (util) => {
    return makeCustomMatcher(
      (value: ArrayLike<any>) => value.length === 0,
      (value) =>
        `Expected array ${util.pp(value)} to be empty but it has size ${
          value.length
        }`,
      (value) => `Expected array ${util.pp(value)} is unexpectedly empty`
    );
  },
  toBeFinite: () => {
    return makeCustomMatcher(
      (value: number) => Number.isFinite(value),
      (value) => `Expected number ${value} to be finite`,
      (value) => `Expected number ${value} not to be finite`
    );
  },
  toHaveOwnProperty: (util) => {
    return makeCustomMatcher(
      (obj: object, value: string) => obj.hasOwnProperty(value),
      (obj: object, value: string) =>
        `Expected object ${util.pp(obj)} to to contain own property ${value}`,
      (obj: object, value: string) =>
        `Expected object ${util.pp(
          obj
        )} not to to contain own property ${value}`
    );
  },
  toBeDate: (util) => {
    return makeCustomMatcher(
      (expected: string | number | Date, actual: string | number | Date) => {
        console.log("called", new Date(expected), new Date(actual));
        return util.equals(new Date(expected), new Date(actual));
      },
      (expected, actual) =>
        `Expected date ${util.pp(expected)} to equal ${actual}`,
      (expected, actual) =>
        `Expected date ${util.pp(expected)} to be different than date ${actual}`
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(genericMatchers);
});
