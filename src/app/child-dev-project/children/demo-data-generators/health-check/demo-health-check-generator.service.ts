import { DemoEntityStore } from "#src/app/core/demo-data/generic/demo-entity-store";
import { admissionDateOf } from "#src/app/core/demo-data/participant-dates";
import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
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
  private readonly demoEntities = inject(DemoEntityStore);

  override requiredEntityTypes = ["HealthCheck", "Child"];

  override get ownedEntityTypes(): string[] {
    return ["HealthCheck"];
  }

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

  public generateEntities(): Entity[] {
    const data = [];

    for (const child of this.demoEntities.get("Child")) {
      data.push(...this.generateHealthCheckHistoryForChild(child));
    }

    return data;
  }

  private generateHealthCheckHistoryForChild(child: Entity): Entity[] {
    const data = [];

    let date = new Date(admissionDateOf(child).getTime());
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
    const dateOfBirth = child["dateOfBirth"];
    if (!(dateOfBirth instanceof Date)) {
      // a use case that does not record a birthday gets the checks of a school age
      return 8;
    }
    const timeDiff = date.getTime() - dateOfBirth.getTime();
    return timeDiff / (1000 * 60 * 60 * 24 * 365);
  }

  private setNextHeightAndWeight(record, previousRecord, age: number) {
    // the tables only cover school age, and the dates a demo record is built from are
    // generated independently - an age outside them would look up no range at all
    const ages = Array.from(heightRangeForAge.keys());
    const ageRoundedToHalfYear = Math.min(
      Math.max(Math.round(2 * age) / 2, Math.min(...ages)),
      Math.max(...ages),
    );

    const randomHeight = faker.number.int(
      heightRangeForAge.get(ageRoundedToHalfYear),
    );
    record.height = Math.max(randomHeight, previousRecord.height); // height will not become less

    record.weight = faker.number.int(
      weightRangeForAge.get(ageRoundedToHalfYear),
    );
  }
}
