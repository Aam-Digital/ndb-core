import { makeCustomMatcher } from "./custom-matcher-utils";

export const mapMatchers: jasmine.CustomMatcherFactories = {
  toHaveKey: (util) => {
    return makeCustomMatcher(
      (expected: Map<any, any>, key: any) => expected.has(key),
      (expected, key) =>
        `Expected map ${util.pp(expected)} to contain '${key}'`,
      (expected, key) =>
        `Expected map ${util.pp(expected)} not to contain '${key}'`,
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(mapMatchers);
});
