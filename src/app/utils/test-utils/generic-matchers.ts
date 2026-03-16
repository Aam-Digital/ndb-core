type MatcherResult = { pass: boolean; message: () => string };
type MatcherContext = {
  equals?: (received: unknown, expected: unknown) => boolean;
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

export const genericMatchers = {
  toEqualArrayWithExactContents(
    this: MatcherContext,
    actual: unknown[],
    expected: unknown[],
  ): MatcherResult {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return {
        pass: false,
        message: () =>
          `Expected both values to be arrays but received ${pp(this, actual)} and ${pp(this, expected)}`,
      };
    }

    if (actual.length !== expected.length) {
      return {
        pass: false,
        message: () =>
          `Expected array ${pp(this, actual)} to have the exact contents of ${pp(this, expected)}`,
      };
    }

    const equals = this.equals ?? Object.is;
    const unmatchedIndexes = new Set(actual.map((_value, index) => index));

    for (const expectedItem of expected) {
      const matchingIndex = [...unmatchedIndexes].find((index) =>
        equals(actual[index], expectedItem),
      );

      if (matchingIndex === undefined) {
        return {
          pass: false,
          message: () =>
            `Expected array ${pp(this, actual)} to have the exact contents of ${pp(this, expected)}`,
        };
      }

      unmatchedIndexes.delete(matchingIndex);
    }

    return {
      pass: true,
      message: () =>
        `Expected array ${pp(this, actual)} not to have the exact contents of ${pp(this, expected)}`,
    };
  },

  toBeEmpty(this: MatcherContext, value: ArrayLike<unknown>): MatcherResult {
    const pass = value.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected array ${pp(this, value)} not to be empty`
          : `Expected array ${pp(this, value)} to be empty but it has size ${value.length}`,
    };
  },

  toBeFinite(_this: MatcherContext, value: number): MatcherResult {
    const pass = Number.isFinite(value);

    return {
      pass,
      message: () =>
        pass
          ? `Expected number ${value} not to be finite`
          : `Expected number ${value} to be finite`,
    };
  },

  toHaveOwnProperty(
    this: MatcherContext,
    obj: object,
    value: string,
  ): MatcherResult {
    const pass = Object.prototype.hasOwnProperty.call(obj, value);

    return {
      pass,
      message: () =>
        pass
          ? `Expected object ${pp(this, obj)} not to contain own property ${value}`
          : `Expected object ${pp(this, obj)} to contain own property ${value}`,
    };
  },

  toBeDate(
    this: MatcherContext,
    actual: string | number | Date,
    expected: string | number | Date,
  ): MatcherResult {
    if (typeof expected === "string" && actual instanceof Date) {
      const [year, month, day] = expected.split("-");
      expected = new Date(Number(year), Number(month) - 1, Number(day));
    }

    const pass = new Date(actual).getTime() === new Date(expected).getTime();

    return {
      pass,
      message: () =>
        pass
          ? `Expected date ${pp(this, actual)} to be different than date ${pp(this, expected)}`
          : `Expected date ${pp(this, actual)} to equal ${pp(this, expected)}`,
    };
  },
};
