import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { DemoChildGenerator } from "../demo-child-generator.service";
import { faker } from "../../../../core/demo-data/faker";
import { ratingAnswers } from "./rating-answers";
import { EntityConfigService } from "../../../../core/entity/entity-config.service";
import { DemoConfigGeneratorService } from "../../../../core/config/demo-config-generator.service";
import { EntityConfig } from "../../../../core/entity/entity-config";
import { Entity } from "../../../../core/entity/model/entity";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

export class DemoHistoricalDataConfig {
  minCountAttributes: number;
  maxCountAttributes: number;
}

@Injectable()
export class DemoHistoricalDataGenerator extends DemoDataGenerator<Entity> {
  static provider(config: DemoHistoricalDataConfig) {
    return [
      {
        provide: DemoHistoricalDataGenerator,
        useClass: DemoHistoricalDataGenerator,
      },
      { provide: DemoHistoricalDataConfig, useValue: config },
    ];
  }

  constructor(
    private childrenGenerator: DemoChildGenerator,
    private config: DemoHistoricalDataConfig,
    private configGenerator: DemoConfigGeneratorService,
  ) {
    super();
  }

  protected generateEntities(): Entity[] {
    const config = this.configGenerator.entities[0];
    const attributes: any[] = Object.keys(
      (
        config.data[
          EntityConfigService.PREFIX_ENTITY_CONFIG + "HistoricalEntityData"
        ] as EntityConfig
      ).attributes,
    );

    const entities: Entity[] = [];
    for (const child of this.childrenGenerator.entities) {
      const countOfData =
        faker.number.int(this.config.maxCountAttributes) +
        this.config.minCountAttributes;
      const historicalDataOfChild = [...Array(countOfData)].map(() => {
        const historicalData = createEntityOfType("HistoricalEntityData");
        historicalData.date = faker.date.past();
        historicalData.relatedEntity = child.getId();
        for (const attribute of attributes) {
          historicalData[attribute] =
            faker.helpers.arrayElement(ratingAnswers).id;
        }
        return historicalData;
      });
      entities.push(...historicalDataOfChild);
    }
    return entities;
  }
}
