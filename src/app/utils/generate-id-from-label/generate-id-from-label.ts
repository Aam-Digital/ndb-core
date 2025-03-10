/**
 * Create a simplified id string from the given text.
 * This generates a camelCase string and replacing special characters with underscores.
 * @param label The input string to be transformed
 */
export function generateIdFromLabel(label: string): string | undefined {
  if (typeof label !== "string") {
    return undefined;
  }

  return label
    .replace(/[^a-zA-Z0-9\s]/g, "_")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s/g, "");
}
