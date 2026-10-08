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

  configData["view:note"] ??= JSON.parse(JSON.stringify(defaultNoteListView));
  configData["view:note/:id"] ??= {
    component: "NoteDetails",
    config: getDefaultNoteDetailsConfig(),
  };

  return configPart;
};

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
