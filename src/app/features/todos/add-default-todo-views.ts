import { ConfigMigration } from "../../core/config/config-migration";
import { Todo } from "./model/todo";

/**
 * Add default view:note/:id NoteDetails config
 * to avoid breaking note details with a default config from AdminModule
 */
export const addDefaultTodoViews: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  const viewConfigKey = `view:${Todo.route}`;

  // List View
  if (!configPart?.["data"][viewConfigKey]) {
    configPart["data"][viewConfigKey] = {
      component: "TodoList",
      config: {
        entityType: "Todo",
        columns: [
          "deadline",
          "subject",
          "assignedTo",
          "startDate",
          "relatedEntities",
        ],
        filters: [
          { id: "assignedTo" },

          {
            id: "due-status",
            type: "prebuilt",
          },
        ],
      },
    };
  }

  // Details View
  if (!configPart?.["data"][viewConfigKey + "/:id"]) {
    configPart["data"][viewConfigKey + "/:id"] = {
      component: "EntityDetails",
      config: {
        entityType: Todo.ENTITY_TYPE,
        panels: [
          {
            title: "Overview",
            components: [
              {
                title: "",
                component: "Form",
                config: {
                  fieldGroups: [
                    {
                      fields: [
                        "subject",
                        "deadline",
                        "startDate",
                        "description",
                        "assignedTo",
                        "relatedEntities",
                        "repetitionInterval",
                        "completed",
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    };
  }

  return configPart;
};
