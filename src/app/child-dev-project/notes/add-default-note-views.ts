import { ConfigMigration } from "../../core/config/config-migration";
import { NoteDetailsConfig } from "./note-details/note-details-config.interface";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";

/**
 * Add default Note view configs (list and details)
 * to avoid breaking note views with a default config from AdminModule
 */
export const addDefaultNoteViews: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  const configData = configPart["data"];

  // Note no longer declares `children`/`schools` in code. Systems that still have
  // a Child or School entity type get the field definitions restored into their
  // own `entity:Note` config, so existing data and the legacy attendance editor
  // keep working; fresh systems never get fields they have no use for.
  for (const [entityConfigKey, fieldName, fieldSchema] of [
    ["entity:Child", "children", LEGACY_CHILD_FIELD],
    ["entity:School", "schools", LEGACY_SCHOOL_FIELD],
  ] as const) {
    ensureLegacyNoteField(configData, entityConfigKey, fieldName, fieldSchema);
  }

  if (!configData["view:note"]) {
    configData["view:note"] = JSON.parse(JSON.stringify(defaultNoteListView));
  }

  if (!configData["view:note/:id"]) {
    const { bottomForm: _ignored, ...defaultsWithoutBottomForm } =
      getDefaultNoteDetailsConfig();
    configData["view:note/:id"] = {
      component: "NoteDetails",
      config: defaultsWithoutBottomForm,
    };
  }

  // Existing configs may rely on the historical default for bottomForm.
  const noteDetailsConfig = (configData["view:note/:id"].config ??= {});
  if (!noteDetailsConfig.bottomForm) {
    noteDetailsConfig.bottomForm = legacyNoteFields(configData);
  }

  return configPart;
};

export function legacyNoteFields(configData: Record<string, unknown>) {
  const fields = [
    configData?.["entity:Child"] ? "children" : undefined,
    configData?.["entity:School"] ? "schools" : undefined,
  ].filter((field) => !!field);

  return fields.length > 0 ? fields : ["relatedEntities"];
}

// matches the `@DatabaseField` that used to be declared directly on the `Note` class
export const LEGACY_CHILD_FIELD: EntitySchemaField = {
  label: $localize`:Label for the participants field of a note:Participants`,
  dataType: "entity",
  isArray: true,
  additional: "Child",
  entityReferenceRole: "composite",
  editComponent: "EditLegacyAttendance",
  anonymize: "retain",
};

// matches the `@DatabaseField` that used to be declared directly on the `Note` class
export const LEGACY_SCHOOL_FIELD: EntitySchemaField = {
  label: $localize`:label for the linked schools:Groups`,
  dataType: "entity",
  isArray: true,
  additional: "School",
  entityReferenceRole: "composite",
  anonymize: "retain",
};

/**
 * Restore a legacy Note field's definition into a system's own `entity:Note` config
 * if that system still has the related entity type configured, so neither existing
 * data nor a customized field definition is lost. Does nothing for a system that
 * never had the related entity type, and never overwrites an already-customized field.
 */
function ensureLegacyNoteField(
  configData: Record<string, any>,
  entityConfigKey: string,
  fieldName: string,
  fieldSchema: EntitySchemaField,
) {
  if (!configData[entityConfigKey]) {
    return;
  }

  const noteConfig = (configData["entity:Note"] ??= {});
  const attributes = (noteConfig.attributes ??= {});
  attributes[fieldName] ??= fieldSchema;
}

export const defaultNoteListView = {
  component: "EntityList",
  config: {
    entityType: "Note",
    title: $localize`:title of the note list view:Notes & Reports`,
    clickMode: "popup-details",
    columns: ["date", "subject", "category", "authors", "relatedEntities"],
    filters: [
      { id: "warningLevel" },
      { id: "date", default: 1 },
      { id: "category" },
      { id: "authors" },
    ],
  },
};

/**
 * Default configuration for Note Details.
 */
export function getDefaultNoteDetailsConfig(): NoteDetailsConfig {
  return {
    entityType: "Note",
    topForm: ["date", "warningLevel", "category", "authors", "attachment"],
    middleForm: ["subject", "text"],
    bottomForm: ["relatedEntities"],
  };
}
