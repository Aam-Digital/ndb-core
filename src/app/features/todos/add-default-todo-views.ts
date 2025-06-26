import { ConfigMigration } from "../../core/config/config-migration";
import { Todo } from "./model/todo";
import { PLACEHOLDERS } from "../../core/entity/schema/entity-schema-field";
import moment from "moment/moment";
import { DataFilter } from "../../core/filter/filters/filters";
import { PrebuiltFilterConfig } from "../../core/entity-list/EntityListConfig";

/**
 * Add default view:note/:id NoteDetails config
 * to avoid breaking note details with a default config from AdminModule
 */
export const addDefaultTodoViews: ConfigMigration = (key, configPart) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  const configData = configPart["data"];
  const viewConfigKey = `view:${Todo.route.substring(1) /* remove leading slash */}`;

  // List View
  if (!configData[viewConfigKey]) {
    // add standard list view
    configData[viewConfigKey] = JSON.parse(JSON.stringify(defaultTodoListView));
  } else {
    // add prebuilt filter to existing list view
    const existingFilters = configData[viewConfigKey].config.filters || [];
    if (!existingFilters.some((f) => f.id === todoDueStatusFilter.id)) {
      existingFilters.push(JSON.parse(JSON.stringify(todoDueStatusFilter)));
    }
    configData[viewConfigKey].config.filters = existingFilters;
  }

  // Details View
  if (!configData[viewConfigKey + "/:id"]) {
    configData[viewConfigKey + "/:id"] = JSON.parse(
      JSON.stringify(defaultTodoDetailsView),
    );
  }

  return configPart;
};

export const defaultTodoListView = {
  component: "EntityList",
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
      { id: "assignedTo", default: PLACEHOLDERS.CURRENT_USER },
      { id: "todo-due-status", type: "prebuilt" },
    ],
    defaultSort: { active: "deadline", direction: "asc" },
    clickMode: "popup-details",
  },
};

export const defaultTodoDetailsView = {
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

/**
 * Special filter with pre-defined categories of Todo items.
 */
export const todoDueStatusFilter: PrebuiltFilterConfig<Todo> = {
  id: "todo-due-status",
  type: "prebuilt",
  label: $localize`Tasks due`,
  options: [
    {
      key: "current",
      label: $localize`:Filter-option for todos:Currently Active`,
      filter: {
        $and: [
          { isCompleted: false },
          {
            $or: [
              {
                startDate: {
                  $exists: false,
                },
              },
              {
                startDate: {
                  $lte: moment().format("YYYY-MM-DD"),
                  $gt: "",
                },
              },
              {
                deadline: {
                  $lte: moment().format("YYYY-MM-DD"),
                  $gt: "",
                },
              },
            ],
          },
        ],
      } as DataFilter<Todo>,
    },
    {
      key: "overdue",
      label: $localize`:Filter-option for todos:Overdue`,
      filter: { isOverdue: true },
    },
    {
      key: "completed",
      label: $localize`:Filter-option for todos:Completed`,
      filter: { isCompleted: true, isActive: { $exists: true } },
    },
    {
      key: "open",
      label: $localize`:Filter-option for todos:All Open`,
      filter: { isCompleted: false },
    },
    { key: "", label: $localize`Any`, filter: {} },
  ],
  singleSelectOnly: true,
  default: "current",
};
