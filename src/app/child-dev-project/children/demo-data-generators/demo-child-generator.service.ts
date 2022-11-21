import { Child } from "../model/child";
import { religions } from "./fixtures/religions";
import { languages } from "./fixtures/languages";
import { dropoutTypes } from "./fixtures/dropout-types";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { faker } from "../../../core/demo-data/faker";
import { centersWithProbability } from "./fixtures/centers";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { genders } from "../model/genders";
import { calculateAge } from "../../../utils/utils";
import { DateWithAge } from "../model/dateWithAge";

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

  static generateEntity(id: string) {
    const child = new Child(id);
    child.name = faker.name.firstName() + " " + faker.name.lastName();
    child.projectNumber = id;
    child["religion"] = faker.helpers.arrayElement(religions);
    child.gender = faker.helpers.arrayElement(genders.slice(1));
    child.dateOfBirth = new DateWithAge(faker.dateOfBirth(5, 20));
    child["motherTongue"] = faker.helpers.arrayElement(languages);
    child.center = faker.helpers.arrayElement(centersWithProbability);
    child.phone =
      "+" +
      faker.datatype.number({ min: 10, max: 99 }) +
      " " +
      faker.datatype.number({ min: 10000000, max: 99999999 });

    child.admissionDate = faker.date.past(calculateAge(child.dateOfBirth) - 4);

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
    child.dropoutType = faker.helpers.arrayElement(dropoutTypes);
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
