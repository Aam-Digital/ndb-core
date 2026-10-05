/**
 * Split a stored condition fragment into its negation flag and the positive
 * fragment inside it, so the value editor only ever deals with the positive
 * form regardless of whether the condition is negated.
 */
export function splitNegation(fragment: any): {
  negated: boolean;
  positive: any;
} {
  if (
    fragment &&
    typeof fragment === "object" &&
    !Array.isArray(fragment) &&
    "$not" in fragment
  ) {
    return { negated: true, positive: fragment.$not };
  }
  return { negated: false, positive: fragment };
}

/** Wrap a positive fragment so it matches everything except itself. */
export function negate(positive: any): any {
  return { $not: positive };
}

/**
 * Build the replacement for `previous` from a freshly built positive fragment,
 * keeping whatever negation `previous` carried.
 *
 * The editor rebuilds a row's fragment from its value on every edit, so without
 * this the negation of an existing condition would be dropped as soon as its
 * value changed.
 */
export function withSameNegation(previous: any, positive: any): any {
  return splitNegation(previous).negated ? negate(positive) : positive;
}
