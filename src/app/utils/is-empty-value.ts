/**
 * Whether the value is empty, i.e. not set or an empty text or list.
 */
export function isEmptyValue(value: unknown): boolean {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}
