import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
import { DemoChildGenerator } from "../demo-child-generator.service";
import { faker } from "../../../../core/demo-data/faker";
import { ratingAnswers } from "./rating-answers";
import { Entity } from "../../../../core/entity/model/entity";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

export class DemoHistoricalDataConfig {
  minCountAttributes: number;
  maxCountAttributes: number;
}

@Injectable()
export class DemoHistoricalDataGenerator extends DemoDataGenerator<Entity> {
  private childrenGenerator = inject(DemoChildGenerator);
  private config = inject(DemoHistoricalDataConfig);

  override requiredEntityTypes = ["HistoricalEntityData"];

  static provider(config: DemoHistoricalDataConfig) {
    return [
      {
        provide: DemoHistoricalDataGenerator,
        useClass: DemoHistoricalDataGenerator,
      },
      { provide: DemoHistoricalDataConfig, useValue: config },
    ];
  }

  protected generateEntities(): Entity[] {
    const entities: Entity[] = [];
    for (const child of this.childrenGenerator.entities) {
      const countOfData =
        faker.number.int(this.config.maxCountAttributes) +
        this.config.minCountAttributes;
      for (let i = 0; i < countOfData; i++) {
        const historicalData = createEntityOfType("HistoricalEntityData");
        historicalData.date = faker.date.past();
        historicalData.relatedEntity = child.getId();

        historicalData.isMotivatedDuringClass =
          faker.helpers.arrayElement(ratingAnswers).id;
        historicalData.isParticipatingInClass =
          faker.helpers.arrayElement(ratingAnswers).id;
        historicalData.isInteractingWithOthers =
          faker.helpers.arrayElement(ratingAnswers).id;
        historicalData.doesHomework =
          faker.helpers.arrayElement(ratingAnswers).id;
        historicalData.asksQuestions =
          faker.helpers.arrayElement(ratingAnswers).id;

        entities.push(historicalData);
      }
    }

    return entities;
  }
}
