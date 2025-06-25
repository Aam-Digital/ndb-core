import { ConfigMigration } from "../../core/config/config-migration";

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
      config: {},
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
