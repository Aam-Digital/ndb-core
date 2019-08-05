import {faker} from './faker';
import {Entity} from '../entity/entity';
import {Child} from '../children/child';
import {Gender} from '../children/Gender';
import {religions} from './fixtures/religions';
import {centers} from './fixtures/centers';
import {languages} from './fixtures/languages';
import {dropoutTypes} from './fixtures/dropout-types';
import {Injectable} from '@angular/core';
import {DemoDataGenerator} from './demo-data-generator';

@Injectable()
export class DemoChildGenerator extends DemoDataGenerator {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoUserProvider.provider(150)]`
   * @param count The number of entities the service should generate.
   */
  static provider(count: number) {
    return {
      provide: DemoChildGenerator,
      useValue: new DemoChildGenerator(count),
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
      const child = new Child(String(i));
      child.name = faker.name.firstName() + ' ' + faker.name.lastName();
      child.projectNumber = String(i);
      child.religion = faker.random.arrayElement(religions);
      child.gender = faker.random.arrayElement([Gender.MALE, Gender.FEMALE]);
      child.dateOfBirth = faker.date.birthdate(5, 20);
      child.motherTongue = faker.random.arrayElement(languages);
      child.center = faker.random.arrayElement(centers);

      child.admissionDate = faker.date.past(child.age - 4);


      if (faker.random.number(100) > 80) {
        this.makeChildDropout(child);
      }

      data.push(child);
    }
    return data;
  }

  private makeChildDropout(child: Child) {
    child.dropoutDate = faker.date.between(child.admissionDate, new Date());
    child.dropoutRemarks = faker.lorem.sentence();
    child.dropoutType = faker.random.arrayElement(dropoutTypes);
    child.status = 'Dropout';
  }
}
