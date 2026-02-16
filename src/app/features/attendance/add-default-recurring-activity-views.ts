import { ConfigMigration } from "#src/app/core/config/config-migration";

/**
 * Add default view:attendance/recurring-activity RecurringActivity config
 * to avoid breaking recurringActivity details with a default config from AdminModule
 */
export const addDefaultRecurringActivityDetailsConfig: ConfigMigration = (
  key,
  configPart,
) => {
  if (configPart?.["_id"] !== "Config:CONFIG_ENTITY" || !configPart?.["data"]) {
    // add only at top-level of config
    return configPart;
  }

  if (!configPart?.["data"]["view:attendance/recurring-activity"]) {
    configPart["data"]["view:attendance/recurring-activity"] = {
      component: "EntityList",
      config: {
        entityType: "RecurringActivity",
        columns: ["title", "type", "assignedTo"],
        exportConfig: [
          {
            label: "Title",
            query: "title",
          },
          {
            label: "Type",
            query: "type",
          },
          {
            label: "Assigned users",
            query: "assignedTo",
          },
        ],
      },
    };
  }
  if (!configPart?.["data"]["view:attendance/recurring-activity/:id"]) {
    configPart["data"]["view:attendance/recurring-activity/:id"] = {
      component: "EntityDetails",
      config: {
        entityType: "RecurringActivity",
        panels: [
          {
            title: "Basic Information",
            components: [
              {
                component: "Form",
                config: {
                  fieldGroups: [
                    {
                      fields: ["title"],
                    },
                    {
                      fields: ["type"],
                    },
                    {
                      fields: ["assignedTo"],
                    },
                  ],
                },
              },
            ],
          },
          {
            title: "Participants",
            components: [
              {
                component: "Form",
                config: {
                  fieldGroups: [
                    {
                      fields: [
                        "linkedGroups",
                        "participants",
                        "excludedParticipants",
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            title: "Events & Attendance",
            components: [
              {
                component: "ActivityAttendanceSection",
              },
            ],
          },
        ],
      },
    };
  }

  return configPart;
};
