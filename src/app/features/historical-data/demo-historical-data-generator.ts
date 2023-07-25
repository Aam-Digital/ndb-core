import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { HistoricalEntityData } from "./model/historical-entity-data";
import { Injectable } from "@angular/core";
import { DemoChildGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { faker } from "../../core/demo-data/faker";
import { ENTITY_CONFIG_PREFIX } from "../../core/entity/model/entity";
import { DemoConfigGeneratorService } from "../../core/config/demo-config-generator.service";
import { ratingAnswers } from "./model/rating-answers";

export class DemoHistoricalDataConfig {
  minCountAttributes: number;
  maxCountAttributes: number;
}

@Injectable()
export class DemoHistoricalDataGenerator extends DemoDataGenerator<HistoricalEntityData> {
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
    private configGenerator: DemoConfigGeneratorService,
    private config: DemoHistoricalDataConfig,
  ) {
    super();
  }

  protected generateEntities(): HistoricalEntityData[] {
    const config = this.configGenerator.entities[0];
    const attributes: any[] = config.data[
      ENTITY_CONFIG_PREFIX + HistoricalEntityData.ENTITY_TYPE
    ].attributes.map((attr) => attr.name);
    const entities: HistoricalEntityData[] = [];
    for (const child of this.childrenGenerator.entities) {
      const countOfData =
        faker.number.int(this.config.maxCountAttributes) +
        this.config.minCountAttributes;
      const historicalDataOfChild = [...Array(countOfData)].map(() => {
        const historicalData = new HistoricalEntityData();
        historicalData.date = faker.date.past();
        historicalData.relatedEntity = child.getId();
        for (const attribute of attributes) {
          historicalData[attribute] = faker.helpers.arrayElement(ratingAnswers);
        }
        return historicalData;
      });
      entities.push(...historicalDataOfChild);
    }
    return entities;
  }
}
