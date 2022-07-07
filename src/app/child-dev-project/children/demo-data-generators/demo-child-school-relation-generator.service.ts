import { DemoChildGenerator } from "./demo-child-generator.service";
import { DemoSchoolGenerator } from "../../schools/demo-school-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../model/child";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import faker from "faker/locale/en_IND";
import { School } from "../../schools/model/school";

/**
 * Generate ChildSchoolRelation entities linking a child to a school for a specific year.
 * Builds upon the generated demo Child and demo School entities,
 * generating relations for each Child from the date of admission till dropout or today.
 */
@Injectable()
export class DemoChildSchoolRelationGenerator extends DemoDataGenerator<ChildSchoolRelation> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoChildSchoolRelationGenerator.provider()]`
   */
  static provider() {
    return [
      {
        provide: DemoChildSchoolRelationGenerator,
        useClass: DemoChildSchoolRelationGenerator,
      },
    ];
  }

  constructor(
    private demoChildren: DemoChildGenerator,
    private demoSchools: DemoSchoolGenerator
  ) {
    super();
  }

  generateEntities(): ChildSchoolRelation[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      data.push(...this.generateChildSchoolRecordsForChild(child));
    }

    return data;
  }

  private generateChildSchoolRecordsForChild(
    child: Child
  ): ChildSchoolRelation[] {
    const data = [];

    const firstYear = child.admissionDate.getFullYear();
    let finalYear = new Date().getFullYear();
    if (child.dropoutDate) {
      finalYear = child.dropoutDate.getFullYear();
    }

    let currentSchool: School = undefined;
    let offset = 0;
    while (firstYear + offset <= finalYear && offset <= 12) {
      currentSchool = this.selectNextSchool(currentSchool);
      data.push(
        this.generateRecord(
          child,
          firstYear + offset,
          offset + 1,
          currentSchool
        )
      );

      offset++;
    }
    if (Math.random() < 0.8) {
      // 80% of the latest records for each child don't have an end date, which means the child currently attends this school.
      delete (data[data.length - 1] as ChildSchoolRelation).end;
    }

    this.setChildSchoolAndClassForLegacyUse(child, data[data.length - 1]);

    return data;
  }

  private generateRecord(
    child: Child,
    year,
    schoolClass: number,
    school: School
  ): ChildSchoolRelation {
    const schoolRelation = new ChildSchoolRelation();
    schoolRelation.childId = child.getId();
    schoolRelation.start = new Date(year + "-01-01");
    schoolRelation.end = new Date(year + "-12-31");
    schoolRelation.schoolClass = String(schoolClass);
    schoolRelation.schoolId = school.getId();
    schoolRelation.result = faker.datatype.number(100);
    return schoolRelation;
  }

  /**
   * Select a different school randomly in a certain percentages of cases keeping the currentSchool otherwise.
   * @param currentSchool
   */
  private selectNextSchool(currentSchool: School) {
    if (!currentSchool) {
      return faker.helpers.arrayElement(this.demoSchools.entities);
    }

    if (faker.datatype.number(100) > 75) {
      return faker.helpers.arrayElement(this.demoSchools.entities);
    } else {
      return currentSchool;
    }
  }

  private setChildSchoolAndClassForLegacyUse(
    child: Child,
    latestChildSchoolRelation: ChildSchoolRelation
  ) {
    child.schoolId = latestChildSchoolRelation.schoolId;
    child.schoolClass = latestChildSchoolRelation.schoolClass;
  }
}
