import { times } from "lodash-es";

import { Entity } from "../../../core/entity/model/entity";
import { religions } from "./fixtures/religions";
import { languages } from "./fixtures/languages";
import { dropoutTypes } from "./fixtures/dropout-types";
import { inject, Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { faker } from "../../../core/demo-data/faker";
import { centersWithProbability } from "./fixtures/centers";
import { genders } from "../model/genders";
import { calculateAge } from "../../../utils/utils";
import { DateWithAge } from "../../../core/basic-datatypes/date-with-age/dateWithAge";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import configurableEnums from "../../../../assets/base-configs/education/configurable-enums.json";

export class DemoChildConfig {
  count: number;
}

@Injectable()
export class DemoChildGenerator extends DemoDataGenerator<Entity> {
  override requiredEntityTypes = ["Child"];

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
    return times(this.config.count, (i) => {
      const inactive = faker.datatype.boolean({ probability: 0.2 });
      return generateChild({ id: String(i + 1), inactive });
    });
  }
}

export function generateChild(
  opts: { id?: string; inactive?: boolean; name?: string } = {},
): Entity & { name: string } {
  const id = opts.id ?? faker.string.alphanumeric(20);

  const child = createEntityOfType("Child", id) as Entity & {
    name: string;
    [key: string]: any;
  };
  child.name =
    opts.name ?? `${faker.person.firstName()} ${faker.person.lastName()}`;
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
  child.riskStatus = faker.datatype.boolean({ probability: 0.25 })
    ? faker.helpers.arrayElement(
        configurableEnums.find((x) => x._id === "ConfigurableEnum:riskStatus")
          ?.values,
      )
    : undefined;

  child["address"] = faker.geoAddress();

  if (opts.inactive ?? false) {
    child.dropoutDate = faker.date.between({
      from: child.admissionDate,
      to: faker.defaultRefDate(),
    });
    child.dropoutRemarks = faker.lorem.sentence();
    child.dropoutType = faker.helpers.arrayElement(dropoutTypes);
    child.inactive = true;
  }
  return child;
}
