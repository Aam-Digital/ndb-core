import {faker} from '../faker';
import {School} from '../../schools/school';
import {Injectable} from '@angular/core';
import {DemoDataGenerator} from '../demo-data-generator';


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
      school.medium = faker.random.arrayElement(['Hindi', 'English', 'Bengali']);
      school.name = faker.name.firstName() + ' ' +
        faker.random.arrayElement(['School', 'High School', school.medium + ' Medium']);
      school.address = faker.address.streetAddress();
      school.phone = faker.phone.phoneNumberFormat();
      school.privateSchool = faker.random.boolean();
      school.upToClass = faker.random.arrayElement([8, 10, 12]);
      school.academicBoard = faker.random.arrayElement(['CBSE', 'ICSE', 'WBBSE']);
      school.timing = faker.random.arrayElement(['6 a.m. - 11 a.m.', '11 a.m. - 4 p.m.', '6:30-11:00 and 11:30-16:00']);
      school.workingDays = faker.random.arrayElement(['Mon - Fri', 'Mon - Fri', 'Mon - Sat']);

      data.push(school);
    }
    return data;
  }
}
