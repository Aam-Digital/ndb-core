import {DemoChildGenerator} from './demo-child-generator.service';
import {DemoSchoolGenerator} from './demo-school-generator.service';
import {DemoDataGenerator} from '../demo-data-generator';
import {Injectable} from '@angular/core';
import {Child} from '../../children/child';
import {ChildSchoolRelation} from '../../children/childSchoolRelation';

@Injectable()
export class DemoChildSchoolRelationGenerator extends DemoDataGenerator<ChildSchoolRelation> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoChildSchoolRelationGenerator.provider()]`
   */
  static provider() {
    return [
      { provide: DemoChildSchoolRelationGenerator, useClass: DemoChildSchoolRelationGenerator },
    ];
  }

  constructor(private demoChildren: DemoChildGenerator, private demoSchools: DemoSchoolGenerator) {
    super();
  }

  generateEntities(): ChildSchoolRelation[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      // TODO
    }

    return data;
  }
}
