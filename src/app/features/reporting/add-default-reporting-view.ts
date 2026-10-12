import { ConfigMigration } from "../../core/config/config-migration";

/**
 * Add default view:report Reporting config
 * to avoid having to add this fixed view to every deployment's config
 */
export const addDefaultReportingView: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  if (!configPart["data"]["view:report"]) {
    configPart["data"]["view:report"] = { component: "Reporting" };
  }
  return configPart;
};
