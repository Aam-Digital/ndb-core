function generateSimplifiedId(label: string) {
  return label
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/\s/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_*/, "")
    .replace(/_*$/, "");
}

/**
 * Create a simplified id string from the given text.
 * This generates a camelCase string, so that it can be used as an id.
 * @param label The input string to be transformed
 */
export function generateIdFromLabel(label: string) {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s/g, "");
}
