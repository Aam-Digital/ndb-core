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

/** Re-apply a negation flag to a freshly built positive fragment. */
export function applyNegation(positive: any, negated: boolean): any {
  return negated ? { $not: positive } : positive;
}
