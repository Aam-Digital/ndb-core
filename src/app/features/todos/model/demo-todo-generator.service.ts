import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { DemoChildGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { faker } from "../../../core/demo-data/faker";
import moment from "moment/moment";
import { Entity } from "../../../core/entity/model/entity";
import { Todo } from "./todo";

export class DemoTodoConfig {
  minPerChild: number;
  maxPerChild: number;
}

@Injectable()
export class DemoTodoGeneratorService extends DemoDataGenerator<Todo> {
  static provider(
    config: DemoTodoConfig = {
      minPerChild: 1,
      maxPerChild: 2,
    },
  ) {
    return [
      { provide: DemoTodoGeneratorService, useClass: DemoTodoGeneratorService },
      { provide: DemoTodoConfig, useValue: config },
    ];
  }

  constructor(
    private config: DemoTodoConfig,
    private demoChildren: DemoChildGenerator,
    private demoUsers: DemoUserGeneratorService,
  ) {
    super();
  }

  public generateEntities(): Todo[] {
    return generateTodos({
      children: this.demoChildren.entities,
      assignedTo: this.demoUsers.entities,
      minPerChild: this.config.minPerChild,
      maxPerChild: this.config.maxPerChild,
    });
  }
}

export function generateTodos(params: {
  children: Entity[];
  assignedTo: Entity[];
  minPerChild: number;
  maxPerChild: number;
}): Todo[] {
  const data = [];
  for (const child of params.children) {
    if (!child.isActive) {
      continue;
    }

    let numberOfRecords = faker.number.int({
      min: params.minPerChild,
      max: params.maxPerChild,
    });

    for (let i = 0; i < numberOfRecords; i++) {
      data.push(
        generateTodo({
          entity: child,
          assignedTo: faker.helpers.arrayElements(params.assignedTo, 1),
        }),
      );
    }
  }

  return data;
}

/**
 * @param opts
 * @param opts.isDue If true, the generated deadline is before the reference
 * date (today). If false, the deadline is after the reference date.
 */
export function generateTodo({
  entity,
  assignedTo,
  isDue,
}: {
  entity: Entity;
  assignedTo: Entity[];
  isDue?: boolean;
}): Todo {
  const todo = new Todo(faker.string.alphanumeric(20));

  const selectedStory = faker.helpers.arrayElement(stories);
  todo.subject = selectedStory.subject;
  todo.description = selectedStory.description;

  let deadlineFrom = moment(faker.defaultRefDate()).subtract(5, "days");
  let deadlineTo = moment(faker.defaultRefDate()).add(90, "days");

  if (isDue === true) {
    deadlineTo = moment(faker.defaultRefDate()).subtract(1, "days");
  } else if (isDue === false) {
    deadlineFrom = moment(faker.defaultRefDate()).add(1, "days");
  }
  todo.deadline = faker.date.between({
    from: deadlineFrom.toDate(),
    to: deadlineTo.toDate(),
  });

  faker.helpers.maybe(
    () =>
      (todo.startDate = faker.date.between({
        from: moment(todo.deadline).subtract(25, "days").toDate(),
        to: todo.deadline,
      })),
    { probability: 0.5 },
  );

  todo.relatedEntities = [entity.getId()];

  todo.assignedTo = assignedTo.map((entity) => entity.getId());

  return todo;
}

const stories: Partial<Todo>[] = [
  {
    subject: $localize`:demo todo record:get signed agreement`,
    description: $localize`:demo todo record:We have fixed all the details but still have to put it in writing.`,
  },
  {
    subject: $localize`:demo todo record:follow up`,
    description: $localize`:demo todo record:Call to follow up on the recent developments.`,
  },
  {
    subject: $localize`:demo todo record:call family`,
    description: $localize`:demo todo record:Check about the latest incident.`,
  },
  {
    subject: $localize`:demo todo record:plan career counselling`,
    description: $localize`:demo todo record:Personalized plan for the next discussion has to be prepared.`,
  },
];
