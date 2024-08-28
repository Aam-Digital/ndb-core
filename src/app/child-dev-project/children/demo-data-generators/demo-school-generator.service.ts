import { faker } from "../../../core/demo-data/faker";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Entity } from "../../../core/entity/model/entity";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

export class DemoSchoolConfig {
  count: number;
}

@Injectable()
export class DemoSchoolGenerator extends DemoDataGenerator<Entity> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoSchoolGenerator.provider({count: 10})]`
   * @param config A config object specifying the number of entities the service should generate.
   */
  static provider(config: DemoSchoolConfig) {
    return [
      { provide: DemoSchoolGenerator, useClass: DemoSchoolGenerator },
      { provide: DemoSchoolConfig, useValue: config },
    ];
  }

  private readonly normalSchool = $localize`:School demo name that is connected with a school name:School`;
  private readonly highSchool = $localize`:School demo name that is connected with a school name:High School`;

  constructor(public config: DemoSchoolConfig) {
    super();
  }

  generateEntities(): Entity[] {
    const data = [];

    for (let i = 1; i <= this.config.count; i++) {
      const school = createEntityOfType("School", String(i));
      school["language"] = faker.helpers.arrayElement([
        $localize`:Language of a school:Hindi`,
        $localize`:Language of a school:English`,
        $localize`:Language of a school:Bengali`,
      ]);
      const schoolNameWithType = $localize`:School demo name order for connecting the school name and (High) School|e.g. Example School:${faker.person.firstName()} ${faker.helpers.arrayElement(
        [this.normalSchool, this.highSchool],
      )}`;
      const schoolNameWithLanguage = $localize`${faker.person.firstName()} ${
        school["language"]
      } Medium`;
      school.name = faker.helpers.arrayElement([
        schoolNameWithType,
        schoolNameWithLanguage,
      ]);
      school["phone"] = faker.phone.number();
      school["privateSchool"] = faker.datatype.boolean();
      school["timing"] = faker.helpers.arrayElement([
        $localize`:School demo timing:6 a.m. - 11 a.m.`,
        $localize`:School demo timing:11 a.m. - 4 p.m.`,
        $localize`:School demo timing:6:30-11:00 and 11:30-16:00`,
      ]);

      school["address"] = faker.geoAddress();

      // TODO: remove before merge:
      school["bool"] = faker.helpers.arrayElement([true, false]);
      school["string"] = faker.helpers.arrayElement(["A", "B", "C"]);
      school["enum"] = faker.helpers.arrayElement([{ id: "M" }, { id: "F" }]);
      school["refSingle"] = faker.helpers.arrayElement([
        "School:1",
        "School:2",
      ]);
      school["refMulti"] = faker.helpers.arrayElement([
        ["School:1", "School:2"],
        ["School:3", "School:4"],
      ]);

      data.push(school);
    }
    return data;
  }
}
