import { DemoChildGenerator } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { inject, Injectable } from "@angular/core";
import { faker } from "#src/app/core/demo-data/faker";
import { DemoUserGeneratorService } from "#src/app/core/user/demo-user-generator.service";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { InteractionType } from "#src/app/child-dev-project/notes/model/interaction-type.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { AttendanceService } from "../attendance.service";
import { EventTypeSettings } from "../model/attendance-feature-config";

/**
 * Generate activity entities based on the attendance config's eventTypes.
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

    for (const typeSettings of this.attendanceService.eventTypeSettings) {
      if (!typeSettings.activityType) continue;
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
    typeSettings: EventTypeSettings,
    participants: Entity[],
  ): Entity {
    const assignedUser = faker.helpers.arrayElement(this.demoUser.entities);
    const activity = generateActivity({
      participants,
      assignedUser,
      entityType: typeSettings.activityType!.ENTITY_TYPE,
    });

    // Override participants field if it differs from the default
    if (typeSettings.participantsField !== "participants") {
      delete activity["participants"];
      activity[typeSettings.participantsField] = participants.map((c) =>
        c.getId(),
      );
    }

    // Set assigned user via the configured field
    if (typeSettings.activityAssignedUsersField) {
      activity[typeSettings.activityAssignedUsersField] = [
        assignedUser.getId(),
      ];
    }

    // Set mapped fields on the activity (reverse: event field → activity field)
    for (const [eventField, activityField] of Object.entries(
      typeSettings.fieldMapping,
    )) {
      if (activity[activityField] !== undefined) {
        continue;
      }
      if (activityField === "title" || eventField === "subject") {
        activity[activityField] = activity["title"] ?? activity.toString();
      } else if (activityField === "type" || eventField === "category") {
        activity[activityField] = activity["type"];
      }
    }

    // Fallback: set toStringAttributes if nothing was mapped
    const toStringAttrs = activity.getConstructor().toStringAttributes ?? [];
    if (toStringAttrs.length > 0 && activity[toStringAttrs[0]] === undefined) {
      activity[toStringAttrs[0]] = activity["title"] ?? activity.toString();
    }

    return activity;
  }
}

export const ACTIVITY_TYPES = [
  defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
  defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
].filter((t): t is InteractionType => t !== undefined);

export interface ActivityEntity extends Entity {
  title: string;
  type: InteractionType;
  participants: string[];
  assignedTo: string[];
}

export function generateActivity({
  participants,
  assignedUser,
  title,
  entityType = "RecurringActivity",
}: {
  participants: Entity[];
  assignedUser?: Entity;
  title?: string;
  entityType?: string;
}): ActivityEntity {
  const activity = createEntityOfType(
    entityType,
    faker.string.uuid(),
  ) as ActivityEntity;
  const type = faker.helpers.arrayElement(ACTIVITY_TYPES);

  activity.title =
    title ??
    type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();
  activity.type = type;
  activity.participants = participants.map((c) => c.getId());
  activity.assignedTo = assignedUser ? [assignedUser.getId()] : [];

  return activity;
}
