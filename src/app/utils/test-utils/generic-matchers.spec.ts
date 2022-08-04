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
      (actual: string | number | Date, expected: string | number | Date) => {
        if (typeof expected === "string" && actual instanceof Date) {
          const [year, month, day] = expected.split("-");
          expected = new Date(Number(year), Number(month) - 1, Number(day));
        }
        return util.equals(new Date(actual), new Date(expected));
      },
      (actual, expected) =>
        `Expected date ${util.pp(actual)} to equal ${expected}`,
      (actual, expected) =>
        `Expected date ${util.pp(actual)} to be different than date ${expected}`
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(genericMatchers);
});
