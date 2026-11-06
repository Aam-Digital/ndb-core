/** the setting of a range rule (`range`, `dateRange`, `ageRange`): the lowest and highest allowed value, either can be missing */
export interface RangeConfig<T = unknown> {
  min?: T;
  max?: T;
}

/** the error of a range rule: the configured ends, to word the message ("between ... and ...", "at least ...") */
export type RangeError<T> = RangeConfig<T>;

/** whether a range setting has no end set, so that the rule is switched off */
export function isEmptyRange(range: RangeConfig | null | undefined): boolean {
  return isUnsetEnd(range?.min) && isUnsetEnd(range?.max);
}

function isUnsetEnd(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * The error if the value is outside of the range, otherwise `null`.
 * Ends that are not set are not checked.
 */
export function checkRange<T extends number | Date>(
  value: T,
  { min, max }: RangeConfig<T>,
): RangeError<T> | null {
  const tooLow = min !== undefined && value < min;
  const tooHigh = max !== undefined && value > max;
  if (!tooLow && !tooHigh) {
    return null;
  }
  return {
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
  };
}
