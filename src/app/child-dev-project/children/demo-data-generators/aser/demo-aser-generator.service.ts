import { DemoChildGenerator } from "../demo-child-generator.service";
import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { faker } from "../../../../core/demo-data/faker";
import { mathLevels, readingLevels } from "./skill-levels";
import { WarningLevel } from "../../../warning-level";
import { Entity } from "../../../../core/entity/model/entity";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { Logging } from "../../../../core/logging/logging.service";

/**
 * Generate ASER results every 12 months for each Child until passing.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoAserGeneratorService extends DemoDataGenerator<Entity> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoAserGeneratorService.provider()]`
   */
  static provider() {
    return [
      { provide: DemoAserGeneratorService, useClass: DemoAserGeneratorService },
    ];
  }

  constructor(
    private demoChildren: DemoChildGenerator,
    private entityRegistry: EntityRegistry,
  ) {
    super();
  }

  public generateEntities(): Entity[] {
    if (!this.entityRegistry.has("Aser")) {
      Logging.debug(
        "Skipping demo data generation because entity type is not configured",
        "Aser",
      );
      return [];
    }

    const data = [];

    for (const child of this.demoChildren.entities) {
      data.push(...this.generateAserResultsForChild(child));
    }

    return data;
  }

  private generateAserResultsForChild(child: Entity): Entity[] {
    const data = [];

    let date = new Date(child["admissionDate"].getTime());
    let previousResult = createEntityOfType("Aser");
    const firstLanguage = child["motherTongue"].toLowerCase();
    do {
      const aserResult = createEntityOfType("Aser");
      aserResult.child = child.getId();
      aserResult.date = date;
      aserResult.math = this.selectNextSkillLevel(
        mathLevels.slice(1),
        previousResult.math,
      );
      aserResult.english = this.selectNextSkillLevel(
        readingLevels.slice(1),
        previousResult.english,
      );
      aserResult[firstLanguage] = this.selectNextSkillLevel(
        readingLevels.slice(1),
        previousResult[firstLanguage],
      );

      data.push(aserResult);

      date = new Date(date.getFullYear() + 1, 2, 1);
      previousResult = aserResult;
    } while (
      date < faker.getEarlierDateOrToday(child["dropoutDate"]) &&
      previousResult.getWarningLevel() !== WarningLevel.OK
    );

    return data;
  }

  /**
   * Randomly select the next Aser level for a skill based on the previous result.
   * @param skillRange The array of skill levels for the desired subject (mathLevels or readingLevels)
   * @param previousSkillLevel The string indicating the level from the previous test for this subject
   */
  private selectNextSkillLevel<T extends ConfigurableEnumValue>(
    skillRange: T[],
    previousSkillLevel: T,
  ): T {
    const previousSkillLevelIndex = skillRange.indexOf(previousSkillLevel);

    let nextSkillLevelIndex;
    const random = faker.number.int(100);
    if (random < 20) {
      nextSkillLevelIndex = previousSkillLevelIndex;
    } else if (random < 90) {
      nextSkillLevelIndex = previousSkillLevelIndex + 1;
    } else {
      nextSkillLevelIndex = previousSkillLevelIndex + 2;
    }

    return skillRange[this.trimToValidIndex(nextSkillLevelIndex, skillRange)];
  }

  /**
   * Convert the given number to a valid index of the array by capping it to a range of [0, array.lenght -1]
   * @param index
   * @param array
   */
  private trimToValidIndex(index: number, array: any[]) {
    if (index < 0) {
      return 0;
    }
    return Math.min(index, array.length - 1);
  }
}
