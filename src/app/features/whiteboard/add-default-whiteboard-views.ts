import { ConfigMigration } from "../../core/config/config-migration";
import { Whiteboard } from "./model/whiteboard";

/**
 * Add the default list and board views for whiteboards
 * to avoid having to add these fixed views to every deployment's config.
 */
export const addDefaultWhiteboardViews: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  const configData = configPart["data"];
  const viewConfigKey = `view:${Whiteboard.route.substring(1) /* remove leading slash */}`;

  if (!configData[viewConfigKey]) {
    configData[viewConfigKey] = JSON.parse(
      JSON.stringify(defaultWhiteboardListView),
    );
  }
  if (!configData[viewConfigKey + "/:id"]) {
    configData[viewConfigKey + "/:id"] = JSON.parse(
      JSON.stringify(defaultWhiteboardView),
    );
  }

  return configPart;
};

export const defaultWhiteboardListView = {
  component: "EntityList",
  config: {
    entityType: Whiteboard.ENTITY_TYPE,
    columns: ["title"],
  },
};

export const defaultWhiteboardView = {
  component: "Whiteboard",
  config: {
    entityType: Whiteboard.ENTITY_TYPE,
  },
};
