export const mapMatchers: jasmine.CustomMatcherFactories = {
  toBeKeyOf: (util) => {
    return {
      compare: (key: any, mapPossiblyContainingKey: Map<any, any>) => {
        const result = { pass: false, message: "" };
        if (mapPossiblyContainingKey.has(key)) {
          result.pass = true;
        } else {
          result.message = `Expected map ${util.pp(
            mapPossiblyContainingKey
          )} to contain '${key}'`;
        }
        return result;
      },
    };
  },
};

beforeAll(() => {
  jasmine.addMatchers(mapMatchers);
});
