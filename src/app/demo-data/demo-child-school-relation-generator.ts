import {Entity} from '../entity/entity';
import {DemoChildGenerator} from './demo-child-generator.service';
import {DemoSchoolGenerator} from './demo-school-generator.service';
import {DemoDataGenerator} from './demo-data-generator';


export class DemoChildSchoolRelationGenerator extends DemoDataGenerator {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoChildSchoolRelationGenerator.provider()]`
   */
  static provider() {
    return {
      provide: DemoChildSchoolRelationGenerator,
      useClass: DemoChildSchoolRelationGenerator,
    };
  }

  constructor(private demoChildren: DemoChildGenerator, private demoSchools: DemoSchoolGenerator) {
    super();
  }

  generateEntities(): Entity[] {
    const data = [];

    // TODO
    return data;
  }
}
