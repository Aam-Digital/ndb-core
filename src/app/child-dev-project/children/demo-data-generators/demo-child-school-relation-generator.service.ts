import { DemoEntityStore } from "#src/app/core/demo-data/generic/demo-entity-store";
import { GenericDemoDataEngine } from "#src/app/core/demo-data/generic/generic-demo-data-engine";
import { admissionDateOf } from "#src/app/core/demo-data/participant-dates";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { faker } from "../../../core/demo-data/faker";
import { Entity } from "../../../core/entity/model/entity";

/**
 * Generate ChildSchoolRelation entities linking a child to a school for a specific year.
 * Builds upon the generated demo Child and demo School entities,
 * generating relations for each Child from the date of admission till dropout or today.
 */
@Injectable()
export class DemoChildSchoolRelationGenerator extends DemoDataGenerator<ChildSchoolRelation> {
  override requiredEntityTypes = ["ChildSchoolRelation"];

  private demoEntities = inject(DemoEntityStore);
  private readonly engine = inject(GenericDemoDataEngine);

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

  generateEntities(): ChildSchoolRelation[] {
    const data = [];
    if (this.demoEntities.get("School").length === 0) {
      // nothing to relate the participants to in this use case
      return data;
    }

    for (const child of this.demoEntities.get("Child")) {
      data.push(...this.generateChildSchoolRecordsForChild(child));
    }

    return data;
  }

  private generateChildSchoolRecordsForChild(child: Entity): Entity[] {
    const data: ChildSchoolRelation[] = [];

    const firstYear = admissionDateOf(child).getFullYear();
    let finalYear = new Date().getFullYear();
    if (child["dropoutDate"]) {
      finalYear = child["dropoutDate"].getFullYear();
    }
    // demo dates are generated independently, so a dropout can precede the admission:
    // keep at least the first year, otherwise there is no record to work with below
    finalYear = Math.max(firstYear, finalYear);

    let currentSchool: Entity = undefined;
    let offset = 0;
    while (firstYear + offset <= finalYear && offset <= 12) {
      currentSchool = this.selectNextSchool(currentSchool);
      data.push(
        this.generateRecord(
          child,
          firstYear + offset,
          offset + 1,
          currentSchool,
        ) as ChildSchoolRelation,
      );

      offset++;
    }
    if (Math.random() < 0.8) {
      // 80% of the latest records for each child don't have an end date, which means the child currently attends this school.
      delete data[data.length - 1].end;
    }

    return data;
  }

  private generateRecord(
    child: Entity,
    year,
    schoolClass: number,
    school: Entity,
  ): ChildSchoolRelation {
    const schoolRelation: ChildSchoolRelation = new ChildSchoolRelation();
    schoolRelation.childId = child.getId();
    schoolRelation.schoolId = school.getId();
    schoolRelation.start = new Date(year + "-01-01");
    schoolRelation.end = new Date(year + "-12-31");

    // only in use cases that track a school year; others name these fields differently
    const schema = schoolRelation.getSchema();
    if (schema.has("schoolClass")) {
      schoolRelation["schoolClass"] = String(schoolClass);
    }
    if (schema.has("result")) {
      schoolRelation["result"] = faker.number.int(100);
    }

    // everything else this use case configured on the type
    this.engine.fillRemainingFields(
      schoolRelation,
      ChildSchoolRelation.ENTITY_TYPE,
    );
    return schoolRelation;
  }

  /**
   * Select a different school randomly in a certain percentages of cases keeping the currentSchool otherwise.
   * @param currentSchool
   */
  private selectNextSchool(currentSchool: Entity) {
    if (!currentSchool) {
      return faker.helpers.arrayElement(this.demoEntities.get("School"));
    }

    if (faker.number.int(100) > 75) {
      return faker.helpers.arrayElement(this.demoEntities.get("School"));
    } else {
      return currentSchool;
    }
  }
}
