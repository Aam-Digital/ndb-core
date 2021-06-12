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
import { ENTITY_CONFIG_PREFIX } from "../../core/entity/entity";

export const ratingAnswers = [
  {
    id: "notTrueAtAll",
    label: "not true at all",
  },
  {
    id: "rarelyTrue",
    label: "rarely true",
  },
  {
    id: "usuallyTrue",
    label: "usually true",
  },
  {
    id: "absolutelyTrue",
    label: "absolutelyTrue",
  },
  {
    id: "noAnswerPossible",
    label: "no answer possible",
  },
];

export class DemoHistoricalDataConfig {
  count: number;
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
    return [...Array(this.config.count)].map(() => {
      const historicalData = new HistoricalEntityData();
      historicalData.date = faker.date.past();
      historicalData.relatedEntity = faker.random
        .arrayElement(this.childrenGenerator.entities)
        .getId();
      const amountOfAttributes = faker.datatype.number({
        min: 2,
        max: attributes.length,
      });
      const selectedAttributes = faker.random.arrayElements(
        attributes,
        amountOfAttributes
      );
      for (const attribute of selectedAttributes) {
        historicalData[attribute] = faker.random.arrayElement(ratingAnswer);
      }
      return historicalData;
    });
  }
}
