import { TimeInterval } from "../recurring-interval/time-interval";

export const todoDefaultConfigs = {
  "entity:Todo": {
    label: $localize`:label for entity:Task`,
    labelPlural: $localize`:label (plural) for entity:Tasks`,
    toStringAttributes: ["subject"],
    hasPII: true,

    attributes: {
      subject: {
        dataType: "string",
        label: $localize`:Label:Subject`,
        showInDetailsView: true,
      },
      description: {
        dataType: "long-text",
        showInDetailsView: true,
        label: $localize`:Label:Description`,
      },
      deadline: {
        dataType: "date-only",
        showInDetailsView: true,
        anonymize: "retain",
        label: $localize`:Label:Deadline`,
      },
      startDate: {
        dataType: "date-only",
        showInDetailsView: true,
        anonymize: "retain",
        label: $localize`:Label:Start date`,
        description: $localize`:Description:When you are planning to start work so that you keep enough time before the actual hard deadline.`,
      },
      assignedTo: {
        label: $localize`:Label:Assigned to`,
        dataType: "entity",
        isArray: true,
        additional: "User",
        showInDetailsView: true,
        defaultValue: {
          mode: "dynamic",
          value: "$current_user",
        },
        anonymize: "retain",
      },
      relatedEntities: {
        dataType: "entity",
        isArray: true,
        label: $localize`:label for the related Entities:Related Records`,
        additional: ["Child", "School", "RecurringActivity"],
        entityReferenceRole: "composite",
        showInDetailsView: true,
        anonymize: "retain",
      },
      repetitionInterval: {
        label: $localize`:label for Todo entity property:repeats`,
        additional: [
          {
            label: $localize`:repetition interval option:every week`,
            interval: { amount: 1, unit: "week" },
          },
          {
            label: $localize`:repetition interval option:every month`,
            interval: { amount: 1, unit: "month" },
          },
        ] as { label: string; interval: TimeInterval }[],
        showInDetailsView: true,
        anonymize: "retain",
      },
      completed: {
        label: $localize`:label for Todo entity property:completed`,
        viewComponent: "DisplayTodoCompletion",
        anonymize: "retain",
      },
    },
  },
  "view:todo": {
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
  },
};
