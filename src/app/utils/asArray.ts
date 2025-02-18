/**
 * Convert wrap a value in an array if it is not already an array.
 * @param x
 */

export function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}
