import { Logging } from "../../../core/logging/logging.service";

/**
 * Migrates a raw Note document from the legacy `childrenAttendance` tuple-map DB format
 * to the new `attendance` array-of-objects format introduced in Phase 1 of #1364.
 *
 * Old DB format (childrenAttendance field):
 *   `[[participant, { status: "STATUS_ID", remarks: "..." }], ...]`
 *
 * New DB format (attendance field):
 *   `[{ participant, status: "STATUS_ID", remarks: "..." }, ...]`
 *
 * @param rawDoc A raw PouchDB document object (as stored in the database)
 * @returns The migrated document with `attendance` replacing `childrenAttendance`,
 *          or the original document unchanged if migration does not apply.
 */
export function migrateNoteAttendance(rawDoc: any): any {
  if (!rawDoc || typeof rawDoc !== "object") {
    return rawDoc;
  }

  // Only apply to Note documents
  if (typeof rawDoc._id !== "string" || !rawDoc._id.startsWith("Note:")) {
    return rawDoc;
  }

  // Skip if field is already migrated or not present
  if (!Object.prototype.hasOwnProperty.call(rawDoc, "childrenAttendance")) {
    return rawDoc;
  }

  Logging.debug(`Note attendance migration started for: ${rawDoc._id}`);

  const oldAttendance: [string, any][] = rawDoc.childrenAttendance;

  const newAttendance = Array.isArray(oldAttendance)
    ? oldAttendance.map(([participant, item]) => ({
        participant,
        ...item,
      }))
    : [];

  const { childrenAttendance, ...rest } = rawDoc;

  return {
    ...rest,
    attendance: newAttendance,
  };
}
