/**
 * Normalize participant sources into plain participant IDs.
 *
 * Supports both configured participants field shapes used in attendance:
 * - `string[]` with direct entity IDs (datatype `entity`)
 * - attendance-like entries containing a `participant` ID (datatype `attendance`)
 */
export function extractParticipantIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const participantIds: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      participantIds.push(entry);
    } else if (
      entry !== null &&
      typeof entry === "object" &&
      typeof (entry as { participant?: unknown }).participant === "string"
    ) {
      participantIds.push((entry as { participant: string }).participant);
    }
  }

  return participantIds;
}
