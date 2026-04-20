import { ConfigMigration } from "../../core/config/config-migration";

export const addDefaultReviewDuplicatesViewConfig: ConfigMigration = (
  key,
  configPart,
) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    return configPart;
  }

  if (!configPart["data"]["view:review-duplicates"]) {
    configPart["data"]["view:review-duplicates"] = {
      component: "ReviewDuplicates",
      _id: "view:review-duplicates",
    };
  }

  return configPart;
};
