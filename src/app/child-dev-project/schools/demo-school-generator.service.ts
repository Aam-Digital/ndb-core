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
      school.medium = faker.random.arrayElement([
        "Hindi",
        "English",
        "Bengali",
      ]);
      school.name =
        faker.name.firstName() +
        " " +
        faker.random.arrayElement([
          $localize`:School demo name that is prepended to a name:School`,
          $localize`:School demo name that is prepended to a name:High School`,
          school.medium + " Medium",
        ]);
      school.address = faker.address.streetAddress();
      school.phone = faker.phone.phoneNumberFormat();
      school.privateSchool = faker.datatype.boolean();
      school.upToClass = faker.random.arrayElement([8, 10, 12]);
      school.academicBoard = faker.random.arrayElement([
        "CBSE",
        "ICSE",
        "WBBSE",
      ]);
      school.timing = faker.random.arrayElement([
        $localize`:School demo timing:6 a.m. - 11 a.m.`,
        $localize`:School demo timing:11 a.m. - 4 p.m.`,
        $localize`:School demo timing:6:30-11:00 and 11:30-16:00`,
      ]);
      school.workingDays = faker.random.arrayElement([
        $localize`:School demo working days:Mon - Fri`,
        $localize`:School demo working days:Mon - Fri`,
        $localize`:School demo working days:Mon - Sat`,
      ]);

      data.push(school);
    }
    return data;
  }
}
