/**
 * Returns true when `leftVersion` is newer than `rightVersion`.
 *
 * The comparison is based on numeric segments to avoid lexicographic issues,
 * e.g. 9.0.0 < 10.0.0.
 */
export function isVersionNewer(
  leftVersion: string,
  rightVersion: string,
): boolean {
  const leftParts = extractNumericParts(leftVersion);
  const rightParts = extractNumericParts(rightVersion);

  if (leftParts.length === 0 || rightParts.length === 0) {
    return false;
  }

  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let i = 0; i < maxLength; i++) {
    const left = leftParts[i] ?? 0;
    const right = rightParts[i] ?? 0;

    if (left > right) {
      return true;
    }
    if (left < right) {
      return false;
    }
  }

  return false;
}

function extractNumericParts(version: string): number[] {
  return (version.match(/\d+/g) ?? []).map(Number);
}
