import {faker} from './faker';
import {School} from '../schools/school';
import {Entity} from '../entity/entity';
import {Injectable} from '@angular/core';
import {DemoDataGenerator} from './demo-data-generator';

@Injectable()
export class DemoSchoolGenerator extends DemoDataGenerator {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoSchoolGenerator.provider(150)]`
   * @param count The number of entities the service should generate.
   */
  static provider(count: number) {
    return {
      provide: DemoSchoolGenerator,
      useValue: new DemoSchoolGenerator(count),
    };
  }

  /**
   * @param count The number of entities this provider should generate
   */
  constructor(public count: number) {
    super();
  }

  generateEntities(): Entity[] {
    const data = [];

    for (let i = 1; i <= this.count; i++) {
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
