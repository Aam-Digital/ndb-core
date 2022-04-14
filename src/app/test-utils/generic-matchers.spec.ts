const genericMatchers: jasmine.CustomMatcherFactories = {
  toBeEmpty: () => {
    return {
      compare: (value: ArrayLike<any>) => {
        const result = { pass: false, message: "" };
        if (value.length === 0) {
          result.pass = true;
        } else {
          result.message = `Expected array ${util.pp(value)} to be empty but it has size ${value.length}`;
        }
        return result;
      },
    };
  },
  toBeFinite: () => {
    return {
      compare: (value: number) => {
        const result = { pass: false, message: "" };
        if (Number.isFinite(value)) {
          result.pass = true;
        } else {
          result.message = `Expected number ${value} to be finite`;
        }
        return result;
      },
    };
  },
  toHaveOwnProperty: (util) => {
    return {
      compare: (obj: object, value: string) => {
        const result = { pass: false, message: "" };
        if (obj.hasOwnProperty(value)) {
          result.pass = true;
        } else {
          result.message = `Expected object ${util.pp(
            obj
          )} to to contain own property ${value}`;
        }
        return result;
      },
    };
  },
  toBeDate: (util, matchers) => {
    return {
      compare: (
        expected: string | number | Date,
        actual: string | number | Date
      ) => {
        const result = { pass: false, message: "" };
        const expectedDate = new Date(expected);
        const actualDate = new Date(actual);
        if (util.equals(expectedDate, actualDate, matchers)) {
          result.pass = true;
        } else {
          result.message = `Expected date ${util.pp(
            expectedDate
          )} to be the same date as ${actualDate}`;
        }
        return result;
      },
    };
  },
};

beforeAll(() => {
  jasmine.addMatchers(genericMatchers);
});
