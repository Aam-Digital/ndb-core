import { ConfigMigration } from "../../core/config/config-migration";
import { NoteDetailsConfig } from "./note-details/note-details-config.interface";

/**
 * Add default view:note/:id NoteDetails config
 * to avoid breaking note details with a default config from AdminModule
 */
export const addDefaultNoteDetailsConfig: ConfigMigration = (
  key,
  configPart,
) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  if (!configPart?.["data"]["view:note/:id"]) {
    configPart["data"]["view:note/:id"] = {
      component: "NoteDetails",
      config: getDefaultNoteDetailsConfig(),
    };
  }
  if (!configPart?.["data"]["view:eventnote/:id"]) {
    configPart["data"]["view:eventnote/:id"] = {
      component: "NoteDetails",
      config: {
        entityType: "EventNote",
      },
    };
  }

  return configPart;
};

/**
 * Default configuration for Note Details.
 */
export function getDefaultNoteDetailsConfig(): NoteDetailsConfig {
  return {
    topForm: ["date", "warningLevel", "category", "authors", "attachment"],
    middleForm: ["subject", "text"],
    bottomForm: ["children", "schools"],
  };
}
