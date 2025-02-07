export const todoDefaultConfigs = {
  // for "entity:Todo" see todo.ts DatabaseField annotations
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
