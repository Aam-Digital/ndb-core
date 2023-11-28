import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { HistoricalEntityData } from "./model/historical-entity-data";
import { Injectable } from "@angular/core";
import { DemoChildGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { faker } from "../../core/demo-data/faker";
import { ratingAnswers } from "./model/rating-answers";
import { EntityConfigService } from "../../core/entity/entity-config.service";
import { DemoConfigGeneratorService } from "../../core/config/demo-config-generator.service";

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
    private config: DemoHistoricalDataConfig,
    private configGenerator: DemoConfigGeneratorService,
  ) {
    super();
  }

  protected generateEntities(): HistoricalEntityData[] {
    return [];
    const config = this.configGenerator.entities[0];
    const attributes: any[] = config.data[
      EntityConfigService.PREFIX_ENTITY_CONFIG +
        HistoricalEntityData.ENTITY_TYPE
    ].attributes.map((attr) => attr.id);

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
