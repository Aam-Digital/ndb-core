import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
import { faker } from "../../../core/demo-data/faker";
import { RecurringActivity } from "../model/recurring-activity";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { Entity } from "../../../core/entity/model/entity";

/**
 * Generate RecurringActivity entities
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoActivityGeneratorService extends DemoDataGenerator<RecurringActivity> {
  override requiredEntityTypes = ["RecurringActivity"];

  private demoChildren = inject(DemoChildGenerator);
  private demoUser = inject(DemoUserGeneratorService);

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
        generateActivity({
          participants: participatingChildren,
          assignedUser: faker.helpers.arrayElement(this.demoUser.entities),
        }),
      );
      i += groupSize;
    }

    return data;
  }
}

const ACTIVITY_TYPES = [
  defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
  defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
];

export function generateActivity({
  participants,
  assignedUser,
  title,
}: {
  participants: Entity[];
  assignedUser?: Entity;
  title?: string;
}): RecurringActivity {
  const activity = new RecurringActivity(faker.string.uuid());
  const type = faker.helpers.arrayElement(ACTIVITY_TYPES);

  activity.title =
    title ??
    type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();
  activity.type = type;
  activity.participants = participants.map((c) => c.getId());
  activity.assignedTo = [assignedUser?.getId()];

  return activity;
}
