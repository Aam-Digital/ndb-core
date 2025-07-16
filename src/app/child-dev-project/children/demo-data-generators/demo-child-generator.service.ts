import { Entity } from "../../../core/entity/model/entity";
import { religions } from "./fixtures/religions";
import { languages } from "./fixtures/languages";
import { dropoutTypes } from "./fixtures/dropout-types";
import { Injectable, inject } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { faker } from "../../../core/demo-data/faker";
import { centersWithProbability } from "./fixtures/centers";
import { genders } from "../model/genders";
import { calculateAge } from "../../../utils/utils";
import { DateWithAge } from "../../../core/basic-datatypes/date-with-age/dateWithAge";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import { range } from "lodash-es";

export class DemoChildConfig {
  count: number;
}

@Injectable()
export class DemoChildGenerator extends DemoDataGenerator<Entity> {
  config = inject(DemoChildConfig);

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

  generateEntities(): Entity[] {
    return generateChildren({ count: this.config.count });
  }
}

export function generateChildren(params: { count: number }): Entity[] {
  return range(params.count).map((i) => generateChild(String(i + 1)));
}

/** @deprecated Don’t pass `id` explicitly, use `generateChild()` instead */
export function generateChild(id: string): Entity;
export function generateChild(): Entity;
export function generateChild(id?: string): Entity {
  id ??= faker.string.alphanumeric(20);

  const child = createEntityOfType("Child", id);
  child.name = faker.person.firstName() + " " + faker.person.lastName();
  child.projectNumber = id;
  child.religion = faker.helpers.arrayElement(religions);
  child.gender = faker.helpers.arrayElement(genders.slice(0, 2));
  child.dateOfBirth = new DateWithAge(
    faker.date.birthdate({ mode: "age", min: 5, max: 20 }),
  );
  child.motherTongue = faker.helpers.arrayElement(languages);
  child.center = faker.helpers.arrayElement(centersWithProbability);
  child.phone =
    "+" +
    faker.number.int({ min: 10, max: 99 }) +
    " " +
    faker.number.int({ min: 10000000, max: 99999999 });

  child.admissionDate = faker.date.past({
    years: calculateAge(child.dateOfBirth) - 4,
  });

  child["address"] = faker.geoAddress();

  if (faker.number.int(100) > 90) {
    child.dropoutDate = faker.date.between({
      from: child.admissionDate,
      to: faker.defaultRefDate(),
    });
    child.dropoutRemarks = faker.lorem.sentence();
    child.dropoutType = faker.helpers.arrayElement(dropoutTypes);
    child.status = $localize`:Child status:Dropout`;
    child.inactive = true;
  }
  return child;
}
