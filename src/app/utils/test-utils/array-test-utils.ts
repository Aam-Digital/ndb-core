import { expect } from "vitest";

function matches(actual: unknown, expected: unknown): boolean {
  try {
    expect(actual).toEqual(expected);
    return true;
  } catch {
    return false;
  }
}

/**
 * Assert that two arrays contain the same items, regardless of order, while
 * still supporting asymmetric matchers such as `expect.objectContaining(...)`.
 */
export function expectArrayWithExactContents(
  actual: unknown[],
  expected: unknown[],
): void {
  expect(actual).toHaveLength(expected.length);

  const unmatched = [...actual];
  for (const expectedItem of expected) {
    const matchIndex = unmatched.findIndex((actualItem) =>
      matches(actualItem, expectedItem),
    );

    expect(matchIndex).toBeGreaterThanOrEqual(0);
    unmatched.splice(matchIndex, 1);
  }
}
