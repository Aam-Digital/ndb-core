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

  const data = configPart["data"];
  if (!data["view:note/:id"]) {
    const { bottomForm: _ignored, ...defaultsWithoutBottomForm } =
      getDefaultNoteDetailsConfig();
    data["view:note/:id"] = {
      component: "NoteDetails",
      config: defaultsWithoutBottomForm,
    };
  }

  // Existing configs may rely on the historical default for bottomForm.
  const noteDetailsConfig = (data["view:note/:id"].config ??= {});
  if (!noteDetailsConfig.bottomForm) {
    noteDetailsConfig.bottomForm = hasChildOrSchoolEntity(data)
      ? ["children", "schools"]
      : ["relatedEntities"];
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
