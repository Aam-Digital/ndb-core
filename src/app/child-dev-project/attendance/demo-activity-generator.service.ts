import { DemoChildGenerator } from "../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../children/model/child";
import { faker } from "../../core/demo-data/faker";
import { RecurringActivity } from "./model/recurring-activity";
import { DemoUserGeneratorService } from "../../core/user/demo-user-generator.service";

/**
 * Generate AttendanceMonth entities for the last 15 months
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoActivityGeneratorService extends DemoDataGenerator<
  RecurringActivity
> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoAttendanceGenerator.provider()]`
   */
  static provider() {
    return [
      {
        provide: DemoActivityGeneratorService,
        useClass: DemoActivityGeneratorService,
      },
    ];
  }

  private readonly MIN_PARTICIPANTS = 3;
  private readonly MAX_PARTICIPANTS = 25;

  private readonly ACTIVITY_TYPES = [
    "Coaching",
    "Class",
    "Training",
    "Life Skills",
  ];

  constructor(
    private demoChildren: DemoChildGenerator,
    private demoUser: DemoUserGeneratorService
  ) {
    super();
  }

  generateEntities(): RecurringActivity[] {
    const data = [];
    const children = this.demoChildren.entities.filter((c) => c.isActive);

    let i = 0;
    while (i < children.length) {
      const groupSize = faker.random.number({
        min: this.MIN_PARTICIPANTS,
        max: this.MAX_PARTICIPANTS,
      });
      const participatingChildren = children.slice(i, i + groupSize);
      data.push(this.generateActivityForChildren(participatingChildren));
      i += groupSize;
    }

    return data;
  }

  private generateActivityForChildren(children: Child[]): RecurringActivity {
    const activity = RecurringActivity.create();
    const type = faker.random.arrayElement(this.ACTIVITY_TYPES);

    activity.title =
      type +
      " " +
      faker.random.number({ min: 1, max: 9 }) +
      faker.random.alphaNumeric(1).toUpperCase();
    activity.type = type;
    activity.participants = children.map((c) => c.getId());
    activity.assignedTo = faker.random.arrayElement(
      this.demoUser.entities
    ).name;

    return activity;
  }
}
