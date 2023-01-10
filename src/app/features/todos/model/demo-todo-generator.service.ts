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
    }
  ) {
    return [
      { provide: DemoTodoGeneratorService, useClass: DemoTodoGeneratorService },
      { provide: DemoTodoConfig, useValue: config },
    ];
  }

  constructor(
    private config: DemoTodoConfig,
    private demoChildren: DemoChildGenerator,
    private demoUsers: DemoUserGeneratorService
  ) {
    super();
  }

  public generateEntities(): Todo[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      if (!child.isActive) {
        continue;
      }

      let numberOfRecords = faker.datatype.number({
        min: this.config.minPerChild,
        max: this.config.maxPerChild,
      });

      for (let i = 0; i < numberOfRecords; i++) {
        data.push(this.generateTodoForEntity(child));
      }
    }

    return data;
  }

  private generateTodoForEntity(entity: Entity): Todo {
    const todo = new Todo(faker.random.alphaNumeric(20));

    const selectedStory = faker.helpers.arrayElement(stories);
    todo.subject = selectedStory.subject;
    todo.description = selectedStory.description;

    todo.deadline = faker.date.between(
      moment().subtract(5, "days").toDate(),
      moment().add(90, "days").toDate()
    );
    faker.helpers.maybe(
      () =>
        (todo.startDate = faker.date.between(
          moment(todo.deadline).subtract(25, "days").toDate(),
          todo.deadline
        )),
      { probability: 0.5 }
    );

    todo.relatedEntities = [entity.getId(true)];

    todo.assignedTo = [
      faker.helpers.arrayElement(this.demoUsers.entities).getId(),
    ];

    return todo;
  }
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
