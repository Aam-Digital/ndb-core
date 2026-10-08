import { Note } from "../model/note";
import {
  LEGACY_NOTE_ATTENDANCE_FIELD,
  LEGACY_NOTE_FIELDS,
} from "./legacy-note-fields";

/**
 * Test helpers to simulate a system that still has the legacy Note fields in its config,
 * using the same definitions the CLI migration writes into `entity:Note`.
 */

/**
 * Add the legacy `children`, `schools` and `childrenAttendance` fields to the Note schema.
 *
 * Note that this only restores the schema, not the array initializers the `Note` class used to have:
 * a test filling one of these fields has to assign the array itself (e.g. `note.children = []`).
 */
export function addLegacyNoteFieldsToSchema() {
  for (const legacy of LEGACY_NOTE_FIELDS) {
    Note.schema.set(legacy.field, {
      label: legacy.labels.en,
      ...legacy.definition,
    });
  }
  Note.schema.set(
    LEGACY_NOTE_ATTENDANCE_FIELD.field,
    structuredClone(LEGACY_NOTE_ATTENDANCE_FIELD.definition),
  );
}

/** Remove the legacy fields again, restoring the schema as defined in code. */
export function removeLegacyNoteFieldsFromSchema() {
  for (const legacy of LEGACY_NOTE_FIELDS) {
    Note.schema.delete(legacy.field);
  }
  Note.schema.delete(LEGACY_NOTE_ATTENDANCE_FIELD.field);
}
