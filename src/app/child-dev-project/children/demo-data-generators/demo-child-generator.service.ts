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
    child.religion = faker.random.arrayElement(religions);
    child.gender = faker.random.arrayElement(genders.slice(1));
    child.dateOfBirth = faker.dateOfBirth(5, 20);
    child.motherTongue = faker.random.arrayElement(languages);
    child.center = faker.random.arrayElement(centersWithProbability);

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
    child.status = "Dropout";
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
