import type { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";

/** languages the app has translations for (see the labels below) */
export const LABEL_LANGUAGES = ["en", "de", "fr"] as const;
export type LabelLanguage = (typeof LABEL_LANGUAGES)[number];

export interface LegacyNoteField {
  /** name of the Note field */
  field: string;
  /** entity type the field links; the field only makes sense in systems that have it */
  entityType: string;
  definition: EntitySchemaField;
  /** translations of the `$localize` label the field had in code */
  labels: Record<LabelLanguage, string>;
}

/**
 * Snapshot of the `@DatabaseField`s that used to be declared on the `Note` class
 * (in the order of the previous default `bottomForm`).
 *
 * `Note` no longer defines these in code. Systems that still rely on them have the definitions
 * written into their own `entity:Note` config by the `oneoff-20261008-note-legacy-child-school-fields`
 * CLI migration, which is the only production code using this snapshot.
 *
 * (This module must stay free of runtime imports, as it is shared with the CLI -
 * see `cli/tsconfig.json`.)
 */
export const LEGACY_NOTE_FIELDS: LegacyNoteField[] = [
  {
    field: "children",
    entityType: "Child",
    definition: {
      dataType: "entity",
      isArray: true,
      additional: "Child",
      entityReferenceRole: "composite",
      editComponent: "EditLegacyAttendance",
      anonymize: "retain",
    },
    labels: { en: "Participants", de: "Teilnehmer:innen", fr: "Participants" },
  },
  {
    field: "schools",
    entityType: "School",
    definition: {
      dataType: "entity",
      isArray: true,
      additional: "School",
      entityReferenceRole: "composite",
      anonymize: "retain",
    },
    labels: { en: "Groups", de: "Gruppen", fr: "Groupes" },
  },
];
