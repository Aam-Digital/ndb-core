import { DemoChildGenerator } from "../demo-child-generator.service";
import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { faker } from "../../../../core/demo-data/faker";
import { heightRangeForAge, weightRangeForAge } from "./height-weight";
import { Entity } from "../../../../core/entity/model/entity";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

/**
 * Generate HealthCheck records every 6 months for children up to the age of 12.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoHealthCheckGeneratorService extends DemoDataGenerator<Entity> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoHealthCheckGeneratorService.provider()]`
   */
  static provider() {
    return [
      {
        provide: DemoHealthCheckGeneratorService,
        useClass: DemoHealthCheckGeneratorService,
      },
    ];
  }

  constructor(private demoChildren: DemoChildGenerator) {
    super();
  }

  public generateEntities(): Entity[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      data.push(...this.generateHealthCheckHistoryForChild(child));
    }

    return data;
  }

  private generateHealthCheckHistoryForChild(child: Entity): Entity[] {
    const data = [];

    let date = new Date(child["admissionDate"].getTime());
    let previousRecord = createEntityOfType("HealthCheck");
    previousRecord.height = 0;
    previousRecord.weight = 0;
    do {
      const record = createEntityOfType("HealthCheck");
      record.child = child.getId();
      record.date = date;
      this.setNextHeightAndWeight(
        record,
        previousRecord,
        this.getAgeAtDate(child, date),
      );

      data.push(record);

      if (date.getMonth() === 0) {
        date = new Date(date.getFullYear(), 5, 1);
      } else {
        date = new Date(date.getFullYear() + 1, 0, 1);
      }
      previousRecord = record;
    } while (
      date < faker.getEarlierDateOrToday(child["dropoutDate"]) &&
      this.getAgeAtDate(child, date) < 11
    );

    return data;
  }

  private getAgeAtDate(child: Entity, date: Date): number {
    const timeDiff = date.getTime() - child["dateOfBirth"].getTime();
    return timeDiff / (1000 * 60 * 60 * 24 * 365);
  }

  private setNextHeightAndWeight(record, previousRecord, age: number) {
    const ageRoundedToHalfYear = Math.round(2 * age) / 2;

    const randomHeight = faker.number.int(
      heightRangeForAge.get(ageRoundedToHalfYear),
    );
    record.height = Math.max(randomHeight, previousRecord.height); // height will not become less

    record.weight = faker.number.int(
      weightRangeForAge.get(ageRoundedToHalfYear),
    );
  }
}
