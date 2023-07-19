/**
 * Create a custom matcher that checks a condition and
 * displays a message when that condition fails, resp. a message when the
 * inverse of that condition fails
 * <br>
 * This is a utility function to create a custom matcher from three functions
 * @param condition The condition to check
 * @param compareMessage The message displayed when the condition fails
 * @param negativeCompareMessage The message displayed when `not` condition failed,
 * i.e. the message displayed when using `expect(x).not.toBeEmpty()`
 */
export function makeCustomMatcher<T>(
  condition: (actual: T, ...expected: any[]) => boolean,
  compareMessage: (actual: T, ...expected: any[]) => string,
  negativeCompareMessage: (actual: T, ...expected: any[]) => string
): jasmine.CustomMatcher {
  return {
    compare: (value: T, ...expected: any[]) => {
      const result = { pass: false, message: "" };
      if (condition(value, ...expected)) {
        result.pass = true;
      } else {
        result.message = compareMessage(value, expected);
      }
      return result;
    },
    negativeCompare: (value: T, ...expected: any[]) => {
      const result = { pass: false, message: "" };
      if (!condition(value, ...expected)) {
        result.pass = true;
      } else {
        result.message = negativeCompareMessage(value, expected);
      }
      return result;
    },
  };
}
