import { faker } from "../../core/demo-data/faker";
import { School } from "./model/school";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";

export class DemoSchoolConfig {
  count: number;
}

@Injectable()
export class DemoSchoolGenerator extends DemoDataGenerator<School> {
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

  constructor(public config: DemoSchoolConfig) {
    super();
  }

  generateEntities(): School[] {
    const data = [];

    for (let i = 1; i <= this.config.count; i++) {
      const school = new School(String(i));
      school["language"] = faker.random.arrayElement([
        "Hindi",
        "English",
        "Bengali",
      ]);
      const schoolName = faker.name.firstName();
      const schoolPrefix = faker.random.arrayElement([
        $localize`:A simple school:School`,
        $localize`:A high school:High School`,
        $localize`:A language school, i.e. Hindi Language:${school["language"]} Language`,
      ]);
      school.name = $localize`:School name + prefix, i.e. Balachendra School or Aryan High School:${schoolName} ${schoolPrefix}`;
      school["address"] = faker.address.streetAddress();
      school["phone"] = faker.phone.phoneNumberFormat();
      school["privateSchool"] = faker.datatype.boolean();
      school["timing"] = faker.random.arrayElement([
        $localize`:School demo timing:6 a.m. - 11 a.m.`,
        $localize`:School demo timing:11 a.m. - 4 p.m.`,
        $localize`:School demo timing:6:30-11:00 and 11:30-16:00`,
      ]);

      data.push(school);
    }
    return data;
  }
}
