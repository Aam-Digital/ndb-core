import { Child } from "../model/child";
import { religions } from "./fixtures/religions";
import { languages } from "./fixtures/languages";
import { dropoutTypes } from "./fixtures/dropout-types";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import faker from "faker/locale/en_IND";
import { centersWithProbability } from "./fixtures/centers";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { genders } from "../model/genders";

export class DemoChildConfig {
  count: number;
}

@Injectable()
export class DemoChildGenerator extends DemoDataGenerator<Child> {
  static count: number;

  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoUserProvider.provider({count: 150})]`
   * @param config The configuration specifying the number of entities the service should generate.
   */
  static provider(config: DemoChildConfig) {
    return [
      { provide: DemoChildGenerator, useClass: DemoChildGenerator },
      { provide: DemoChildConfig, useValue: config },
    ];
  }

  /**
   * Generate a date that works as a date of birth in the given age range.
   * @param minAge The minimum age (today) of a person with the generated random birth date.
   * @param maxAge The maximum age (today) of a person with the generated random birth date.
   */
  static dateOfBirth(minAge: number, maxAge: number): Date {
    const currentYear = new Date().getFullYear();
    const latest = new Date();
    latest.setFullYear(currentYear - minAge);
    const earliest = new Date();
    earliest.setFullYear(currentYear - maxAge);
    return faker.date.between(earliest, latest);
  }

  static generateEntity(id: string) {
    const child = new Child(id);
    child.name = faker.name.firstName() + " " + faker.name.lastName();
    child.projectNumber = id;
    child["religion"] = faker.random.arrayElement(religions);
    child.gender = faker.random.arrayElement(genders.slice(1));
    child.dateOfBirth = this.dateOfBirth(5, 20);
    child["motherTongue"] = faker.random.arrayElement(languages);
    child.center = faker.random.arrayElement(centersWithProbability);
    child.phone =
      "+" +
      faker.datatype.number({ min: 10, max: 99 }) +
      " " +
      faker.datatype.number({ min: 10000000, max: 99999999 });

    child.admissionDate = faker.date.past(child.age - 4);

    if (faker.datatype.number(100) > 90) {
      DemoChildGenerator.makeChildDropout(child);
    }

    // add default photo for easier use in storybook stories
    addDefaultChildPhoto(child);

    return child;
  }

  private static makeChildDropout(child: Child) {
    child.dropoutDate = faker.date.between(child.admissionDate, new Date());
    child.dropoutRemarks = faker.lorem.sentence();
    child.dropoutType = faker.random.arrayElement(dropoutTypes);
    child.status = $localize`:Child status:Dropout`;
  }

  constructor(public config: DemoChildConfig) {
    super();
  }

  generateEntities(): Child[] {
    const data = [];
    for (let i = 1; i <= this.config.count; i++) {
      data.push(DemoChildGenerator.generateEntity(String(i)));
    }
    return data;
  }
}
