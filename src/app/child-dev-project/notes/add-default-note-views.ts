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

    // keep the dedicated children/schools fields if this deployment actually uses them
    if (hasChildOrSchoolEntity(configPart["data"])) {
      configPart["data"]["view:note/:id"].config.bottomForm = [
        "children",
        "schools",
      ];
    }
  }
  return configPart;
};

export function hasChildOrSchoolEntity(configData: Record<string, unknown>) {
  return !!configData?.["entity:Child"] || !!configData?.["entity:School"];
}

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
