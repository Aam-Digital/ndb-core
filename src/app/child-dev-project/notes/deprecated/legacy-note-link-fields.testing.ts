import { Note } from "../model/note";
import { LEGACY_NOTE_FIELDS } from "./legacy-note-fields";

/**
 * Test helpers to simulate a system that still has the legacy Note fields in its config,
 * using the same definitions the CLI migration writes into `entity:Note`.
 */

/** Add the legacy `children` and `schools` fields to the Note schema. */
export function addLegacyNoteFieldsToSchema() {
  for (const legacy of LEGACY_NOTE_FIELDS) {
    Note.schema.set(legacy.field, {
      label: legacy.labels.en,
      ...legacy.definition,
    });
  }
}

/** Remove the legacy fields again, restoring the schema as defined in code. */
export function removeLegacyNoteFieldsFromSchema() {
  for (const legacy of LEGACY_NOTE_FIELDS) {
    Note.schema.delete(legacy.field);
  }
}
