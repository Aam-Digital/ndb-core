import { ConfigMigration } from "../../core/config/config-migration";
import { NoteDetailsConfig } from "./note-details/note-details-config.interface";

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
