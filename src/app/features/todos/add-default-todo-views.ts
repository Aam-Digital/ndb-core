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

  const viewConfigKey = `view:${Todo.route.substring(1) /* remove leading slash */}`;

  // List View
  if (!configPart?.["data"][viewConfigKey]) {
    // add standard Todo list view
    configPart["data"][viewConfigKey] = {
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
  } else {
    // add prebuilt filter to existing Todo list view
    const existingFilters =
      configPart["data"][viewConfigKey].config.filters || [];
    if (!existingFilters.some((f) => f.id === todoDueStatusFilter.id)) {
      existingFilters.push(todoDueStatusFilter);
    }
    configPart["data"][viewConfigKey].config.filters = existingFilters;
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
