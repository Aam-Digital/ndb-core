import { DemoChildGenerator } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
import { faker } from "#src/app/core/demo-data/faker";
import { DemoUserGeneratorService } from "#src/app/core/user/demo-user-generator.service";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceService } from "../attendance.service";
import { ActivityTypeSettings } from "../model/attendance-feature-config";
import { asArray } from "#src/app/utils/asArray";

/**
 * Generate activity entities based on the attendance config's activityTypes.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoActivityGeneratorService extends DemoDataGenerator<Entity> {
  private demoChildren = inject(DemoChildGenerator);
  private demoUser = inject(DemoUserGeneratorService);
  private attendanceService = inject(AttendanceService);

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

  generateEntities(): Entity[] {
    const data: Entity[] = [];
    const children = this.demoChildren.entities.filter((c) => c.isActive);

    for (const typeSettings of this.attendanceService.featureSettings
      .activityTypes) {
      let i = 0;
      while (i < children.length) {
        const groupSize = faker.number.int({
          min: this.MIN_PARTICIPANTS,
          max: this.MAX_PARTICIPANTS,
        });
        const participatingChildren = children.slice(i, i + groupSize);
        data.push(
          this.generateActivityOfType(typeSettings, participatingChildren),
        );
        i += groupSize;
      }
    }

    return data;
  }

  private generateActivityOfType(
    typeSettings: ActivityTypeSettings,
    participants: Entity[],
  ): Entity {
    const activity = new typeSettings.activityType(faker.string.uuid());

    const type = faker.helpers.arrayElement(ACTIVITY_TYPES);
    const title =
      type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();

    activity[typeSettings.participantsField] = participants.map((c) =>
      c.getId(),
    );

    // Detect the field with dataType "entity" and additional "User" on the activity schema
    const assignedUser = faker.helpers.arrayElement(this.demoUser.entities);
    for (const [fieldId, field] of typeSettings.activityType.schema.entries()) {
      if (
        field.dataType === "entity" &&
        asArray(field.additional).includes("User")
      ) {
        activity[fieldId] = [assignedUser?.getId()];
        break;
      }
    }

    // Set mapped fields on the activity (reverse: event field → activity field)
    for (const [eventField, activityField] of Object.entries(
      typeSettings.fieldMapping,
    )) {
      if (activity[activityField] !== undefined) {
        // Already set above
        continue;
      }
      // Populate activity fields that will be mapped to event fields
      if (activityField === "title" || eventField === "subject") {
        activity[activityField] = title;
      } else if (activityField === "type" || eventField === "category") {
        activity[activityField] = type;
      }
    }

    // Fallback: set toStringAttributes if nothing was mapped
    const toStringAttrs = activity.getConstructor().toStringAttributes ?? [];
    if (toStringAttrs.length > 0 && activity[toStringAttrs[0]] === undefined) {
      activity[toStringAttrs[0]] = title;
    }

    return activity;
  }
}

export const ACTIVITY_TYPES = [
  defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
  defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
];
