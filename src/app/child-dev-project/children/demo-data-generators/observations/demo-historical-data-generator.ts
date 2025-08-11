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
    const ratedAttributes: any[] = Array.from(
      this.entityRegistry.get("HistoricalEntityData").schema.entries(),
    )
      .filter(([id, field]) => field.additional === "rating-answer")
      .map(([id, field]) => id);

    const entities: Entity[] = [];
    for (const child of this.childrenGenerator.entities) {
      const countOfData =
        faker.number.int(this.config.maxCountAttributes) +
        this.config.minCountAttributes;
      const historicalDataOfChild = [...Array(countOfData)].map(() => {
        const historicalData = createEntityOfType("HistoricalEntityData");
        for (const attribute of ratedAttributes) {
          historicalData[attribute] = faker.helpers.arrayElement(ratingAnswers);
        }
        historicalData.date = faker.date.past();
        historicalData.relatedEntity = child.getId();
        return historicalData;
      });
      entities.push(...historicalDataOfChild);
    }
    return entities;
  }
}
