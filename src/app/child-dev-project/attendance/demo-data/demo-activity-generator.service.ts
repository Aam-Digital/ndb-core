import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../../children/model/child";
import { faker } from "../../../core/demo-data/faker";
import { RecurringActivity } from "../model/recurring-activity";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { User } from "../../../core/user/user";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";

/**
 * Generate RecurringActivity entities
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoActivityGeneratorService extends DemoDataGenerator<RecurringActivity> {
  private static readonly ACTIVITY_TYPES = [
    defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
    defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
  ];

  /**
   * Create a single instance filled with dummy data.
   * @param children The list of children to be added to the new activity
   * @param assignedUser (Optional) user to be assigned as responsible for the activity
   */
  static generateActivityForChildren(
    children: Child[],
    assignedUser?: User,
  ): RecurringActivity {
    const activity = RecurringActivity.create();
    const type = faker.helpers.arrayElement(this.ACTIVITY_TYPES);

    activity.title =
      type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();
    activity.type = type;
    activity.participants = children.map((c) => c.getId(true));
    activity.assignedTo = [assignedUser?.getId(true)];

    return activity;
  }

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

  constructor(
    private demoChildren: DemoChildGenerator,
    private demoUser: DemoUserGeneratorService,
  ) {
    super();
  }

  generateEntities(): RecurringActivity[] {
    const data = [];
    const children = this.demoChildren.entities.filter((c) => c.isActive);

    let i = 0;
    while (i < children.length) {
      const groupSize = faker.number.int({
        min: this.MIN_PARTICIPANTS,
        max: this.MAX_PARTICIPANTS,
      });
      const participatingChildren = children.slice(i, i + groupSize);
      data.push(
        DemoActivityGeneratorService.generateActivityForChildren(
          participatingChildren,
          faker.helpers.arrayElement(this.demoUser.entities),
        ),
      );
      i += groupSize;
    }

    return data;
  }
}
