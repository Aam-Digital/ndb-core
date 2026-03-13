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

export const mapMatchers = {
  toHaveKey(
    this: MatcherContext,
    expected: Map<unknown, unknown>,
    key: unknown,
  ): MatcherResult {
    const pass = expected.has(key);

    return {
      pass,
      message: () =>
        pass
          ? `Expected map ${pp(this, expected)} not to contain '${String(key)}'`
          : `Expected map ${pp(this, expected)} to contain '${String(key)}'`,
    };
  },
};
