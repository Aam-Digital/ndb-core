import { ConfigMigration } from "../../core/config/config-migration";

/**
 * Add default view:matching MatchingEntities config
 * to avoid having to add this fixed view to every deployment's config
 */
export const addDefaultMatchingView: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  if (!configPart["data"]["view:matching"]) {
    configPart["data"]["view:matching"] = { component: "MatchingEntities" };
  }
  return configPart;
};
