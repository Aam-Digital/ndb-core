import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { Injectable, inject } from "@angular/core";
import { faker } from "#src/app/core/demo-data/faker";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import moment from "moment";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceItem } from "../model/attendance-item";
import { AttendanceService } from "../attendance.service";
import { GenericDemoDataEngine } from "#src/app/core/demo-data/generic/generic-demo-data-engine";
import { EventTypeSettings } from "../model/attendance-feature-config";
import { extractParticipantIds } from "../model/participant-id-extractor";

export class DemoEventsConfig {
  forNLastYears: number;
}

/**
 * Generate Events with participants' attendance details for all activities,
 * using the attendance config to determine entity types and field mappings.
 */
@Injectable()
export class DemoActivityEventsGeneratorService extends DemoDataGenerator<Entity> {
  private config = inject(DemoEventsConfig);
  private demoActivities = inject(DemoActivityGeneratorService);
  private attendanceService = inject(AttendanceService);
  private readonly engine = inject(GenericDemoDataEngine);

  override get ownedEntityTypes(): string[] {
    // an event type without an activity type gets no events here, so the engine fills it
    return this.attendanceService.eventTypeSettings
      .filter((settings) => settings.activityType !== undefined)
      .map((settings) => settings.eventType.ENTITY_TYPE);
  }

  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoActivityEventsGeneratorService.provider()]`
   */
  static provider(
    config: DemoEventsConfig = {
      forNLastYears: 2,
    },
  ) {
    return [
      {
        provide: DemoActivityEventsGeneratorService,
        useClass: DemoActivityEventsGeneratorService,
      },
      { provide: DemoEventsConfig, useValue: config },
    ];
  }

  generateEntities(): Entity[] {
    const data: Entity[] = [];

    for (const activity of this.demoActivities.entities) {
      const typeSettings = this.attendanceService.eventTypeSettings.find(
        (s) =>
          s.activityType !== undefined &&
          s.activityType.ENTITY_TYPE === activity.getType(),
      );
      if (!typeSettings) {
        continue;
      }

      for (
        let dayOffset = 1;
        dayOffset < this.config.forNLastYears * 365;
        dayOffset++
      ) {
        const date = moment(faker.defaultRefDate()).subtract(dayOffset, "days");
        if (date.isoWeekday() === 6 || date.isoWeekday() === 7) {
          // skip Saturday, Sunday
          continue;
        }
        data.push(
          this.generateEventForActivity(typeSettings, activity, date.toDate()),
        );
      }
    }

    return data;
  }

  /**
   * Create a specific event for a date based on the given activity config and fill with random attendance.
   */
  private generateEventForActivity(
    typeSettings: EventTypeSettings,
    activity: Entity,
    date: Date,
  ): Entity {
    const event = new typeSettings.eventType(faker.string.uuid());

    // Set date
    if (typeSettings.dateField) {
      event[typeSettings.dateField] = date;
    }

    // Apply field mapping (activity[actField] → event[evField])
    for (const [evField, actField] of Object.entries(
      typeSettings.fieldMapping,
    )) {
      event[evField] = structuredClone(activity[actField]);
    }

    // Set relatesTo
    event[typeSettings.relatesToField] = activity.getId();

    // Resolve participant IDs from the configured field
    const participantIds = extractParticipantIds(
      activity[typeSettings.participantsField],
    );

    // Set attendance items
    event[typeSettings.attendanceField] = participantIds.map(
      (participantId) => {
        const eventAtt = new AttendanceItem(undefined, "", participantId);
        eventAtt.status = faker.helpers.arrayElement(
          defaultAttendanceStatusTypes,
        );

        if (eventAtt.status.countAs === AttendanceLogicalStatus.ABSENT) {
          eventAtt.remarks = faker.helpers.arrayElement([
            $localize`:Event demo attendance remarks:sick`,
            $localize`:Event demo attendance remarks:fever`,
            $localize`:Event demo attendance remarks:no information`,
          ]);
        }
        return eventAtt;
      },
    );

    // the type is a record type of the use case as well, so fill what it configures

    this.engine.fillRemainingFields(event, event.getType());

    return event;
  }
}
