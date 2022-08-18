import { DemoChildGenerator } from "../../demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../../model/child";
import { faker } from "../../../../core/demo-data/faker";
import { HealthCheck } from "../model/health-check";
import { heightRangeForAge, weightRangeForAge } from "./height-weight";

/**
 * Generate HealthCheck records every 6 months for children up to the age of 12.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoHealthCheckGeneratorService extends DemoDataGenerator<HealthCheck> {
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

  public generateEntities(): HealthCheck[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      data.push(...this.generateHealthCheckHistoryForChild(child));
    }

    return data;
  }

  private generateHealthCheckHistoryForChild(child: Child): HealthCheck[] {
    const data = [];

    let date = new Date(child.admissionDate.getTime());
    let previousRecord = new HealthCheck("");
    previousRecord.height = 0;
    previousRecord.weight = 0;
    do {
      const record = new HealthCheck();
      record.child = child.getId();
      record.date = date;
      this.setNextHeightAndWeight(
        record,
        previousRecord,
        this.getAgeAtDate(child, date)
      );

      data.push(record);

      if (date.getMonth() === 0) {
        date = new Date(date.getFullYear(), 5, 1);
      } else {
        date = new Date(date.getFullYear() + 1, 0, 1);
      }
      previousRecord = record;
    } while (
      date < faker.getEarlierDateOrToday(child.dropoutDate) &&
      this.getAgeAtDate(child, date) < 11
    );

    return data;
  }

  private getAgeAtDate(child: Child, date: Date): number {
    const timeDiff = date.getTime() - child.dateOfBirth.getTime();
    return timeDiff / (1000 * 60 * 60 * 24 * 365);
  }

  private setNextHeightAndWeight(
    record: HealthCheck,
    previousRecord: HealthCheck,
    age: number
  ) {
    const ageRoundedToHalfYear = Math.round(2 * age) / 2;

    const randomHeight = faker.datatype.number(
      heightRangeForAge.get(ageRoundedToHalfYear)
    );
    record.height = Math.max(randomHeight, previousRecord.height); // height will not become less

    record.weight = faker.datatype.number(
      weightRangeForAge.get(ageRoundedToHalfYear)
    );
  }
}
