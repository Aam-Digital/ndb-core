import { ConfigMigration } from "../../core/config/config-migration";

/**
 * Add default view:import Import config
 * to avoid breaking import feature by always providing a default config from core
 */
export const addDefaultImportViewConfig: ConfigMigration = (
  key,
  configPart,
) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  if (!configPart["data"]["view:import"]) {
    configPart["data"]["view:import"] = {
      component: "Import",
      _id: "view:import",
    };
  }

  return configPart;
};
