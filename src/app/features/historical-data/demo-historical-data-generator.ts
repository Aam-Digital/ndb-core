import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { HistoricalEntityData } from "./historical-entity-data";
import { Injectable } from "@angular/core";
import { DemoChildGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { ConfigService } from "../../core/config/config.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../../core/configurable-enum/configurable-enum.interface";
import { faker } from "../../core/demo-data/faker";
import { ENTITY_CONFIG_PREFIX } from "../../core/entity/model/entity";

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
    private configService: ConfigService,
    private config: DemoHistoricalDataConfig
  ) {
    super();
  }

  protected generateEntities(): HistoricalEntityData[] {
    const attributes: any[] = this.configService
      .getConfig<any>(ENTITY_CONFIG_PREFIX + HistoricalEntityData.ENTITY_TYPE)
      .attributes.map((attr) => attr.name);
    const ratingAnswer = this.configService.getConfig<ConfigurableEnumConfig>(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + "rating-answer"
    );
    const entities: HistoricalEntityData[] = [];
    for (const child of this.childrenGenerator.entities) {
      const countOfData =
        faker.datatype.number(this.config.maxCountAttributes) +
        this.config.minCountAttributes;
      const historicalDataOfChild = [...Array(countOfData)].map(() => {
        const historicalData = new HistoricalEntityData();
        historicalData.date = faker.date.past();
        historicalData.relatedEntity = child.getId();
        for (const attribute of attributes) {
          historicalData[attribute] = faker.random.arrayElement(ratingAnswer);
        }
        return historicalData;
      });
      entities.push(...historicalDataOfChild);
    }
    return entities;
  }
}
