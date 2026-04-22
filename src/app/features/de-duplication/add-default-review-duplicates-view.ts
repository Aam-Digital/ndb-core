import { ConfigMigration } from "../../core/config/config-migration";

export const addDefaultReviewDuplicatesViewConfig: ConfigMigration = (
  key,
  configPart,
) => {
  const data = configPart?.["data"];
  if (
    configPart?.["_id"] !== "Config:CONFIG_ENTITY" ||
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return configPart;
  }

  if (!data["view:review-duplicates"]) {
    data["view:review-duplicates"] = {
      component: "ReviewDuplicates",
      _id: "view:review-duplicates",
    };
  }

  return configPart;
};
