type MatcherResult = { pass: boolean; message: () => string };
type MatcherContext = {
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
