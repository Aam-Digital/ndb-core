import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { Entity } from "#src/app/core/entity/model/entity";

type Status = "PLANNED" | "IN_PROGRESS" | "DONE";

/** One action of the sample plan, with its sub-actions. */
interface PlannedAction {
  title: string;
  status?: Status;
  responsible?: string;
  /** months of 2027 (1-12) from the start to the end of the action */
  months: [number, number];
  /** title of the action this one depends on */
  dependsOn?: string;
  subActions?: PlannedAction[];
}

/** The sample plan of the hierarchy use cases (issue #2634). */
const samplePlan: PlannedAction[] = [
  {
    title: "Clean Water 2027",
    status: "IN_PROGRESS",
    months: [1, 12],
    subActions: [
      {
        title: "Community mobilisation",
        responsible: "Asha",
        status: "IN_PROGRESS",
        months: [1, 4],
        subActions: [
          {
            title: "Village meetings",
            responsible: "Ravi",
            months: [2, 3],
            subActions: [
              { title: "Preparation", status: "DONE", months: [2, 2] },
              { title: "Meeting in Rampur", months: [3, 3] },
              {
                title: "Meeting in Sonpur",
                responsible: "Asha",
                months: [3, 3],
              },
            ],
          },
          {
            title: "Volunteer training",
            months: [3, 4],
            subActions: [{ title: "Preparation", months: [3, 3] }],
          },
        ],
      },
      {
        title: "Well construction",
        responsible: "Ravi",
        months: [4, 9],
        subActions: [
          { title: "Site survey", status: "DONE", months: [4, 4] },
          { title: "Well in Rampur", months: [5, 9], dependsOn: "Site survey" },
        ],
      },
      { title: "Final report", months: [11, 12] },
    ],
  },
  {
    title: "School Garden 2027",
    months: [3, 10],
    subActions: [
      {
        title: "Garden beds",
        months: [3, 4],
        subActions: [
          { title: "Buy tools", status: "DONE", months: [3, 3] },
          {
            title: "Build raised beds",
            months: [4, 4],
            dependsOn: "Buy tools",
          },
        ],
      },
      { title: "Planting day", months: [5, 5], dependsOn: "Build raised beds" },
      { title: "Harvest festival", months: [9, 10] },
    ],
  },
];

const statusLabels: Record<Status, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

/**
 * Generate the sample plan of actions and sub-actions for the record type "Action"
 * (defined in the config of demo mode "All Features"), with the users responsible for them.
 */
@Injectable()
export class DemoActionGeneratorService extends DemoDataGenerator<Entity> {
  override requiredEntityTypes = ["Action", "User"];

  static provider() {
    return [
      {
        provide: DemoActionGeneratorService,
        useClass: DemoActionGeneratorService,
      },
    ];
  }

  protected generateEntities(): Entity[] {
    return generateActionPlan();
  }
}

/**
 * The sample plan: users "Asha" and "Ravi" and the actions "Clean Water 2027" and "School Garden 2027"
 * with their sub-actions (also used by the e2e tests).
 */
export function generateActionPlan(): Entity[] {
  const users = ["Asha", "Ravi"].map((name) =>
    Object.assign(createEntityOfType("User", `demo-action-${name}`), {
      name,
      firstname: name,
    }),
  );
  const actions: Entity[] = [];
  const addActions = (planned: PlannedAction[], parent?: Entity) => {
    for (const plannedAction of planned) {
      const action = createAction(plannedAction, parent, users);
      actions.push(action);
      addActions(plannedAction.subActions ?? [], action);
    }
  };
  addActions(samplePlan);

  for (const plannedAction of flatten(samplePlan)) {
    if (plannedAction.dependsOn) {
      const action = actions.find((a) => a["title"] === plannedAction.title);
      action["dependsOn"] = actions
        .find((a) => a["title"] === plannedAction.dependsOn)
        ?.getId();
    }
  }

  return [...users, ...actions];
}

function createAction(
  planned: PlannedAction,
  parent: Entity | undefined,
  users: Entity[],
): Entity {
  const status = planned.status ?? "PLANNED";
  return Object.assign(createEntityOfType("Action"), {
    title: planned.title,
    parentAction: parent?.getId(),
    status: { id: status, label: statusLabels[status] },
    responsible: users.find((u) => u["name"] === planned.responsible)?.getId(),
    timeframe: {
      start: new Date(2027, planned.months[0] - 1, 1),
      end: new Date(2027, planned.months[1], 0),
    },
  });
}

function flatten(planned: PlannedAction[]): PlannedAction[] {
  return planned.flatMap((p) => [p, ...flatten(p.subActions ?? [])]);
}
