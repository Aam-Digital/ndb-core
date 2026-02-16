import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { Injectable, inject } from "@angular/core";
import { faker } from "#src/app/core/demo-data/faker";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import moment from "moment";
import { EventNote } from "../model/event-note";

export class DemoEventsConfig {
  forNLastYears: number;
}

/**
 * Generate Events with participants' attendance details for all RecurringActivities.
 */
@Injectable()
export class DemoActivityEventsGeneratorService extends DemoDataGenerator<EventNote> {
  private config = inject(DemoEventsConfig);
  private demoActivities = inject(DemoActivityGeneratorService);

  /**
   * Create a specific event for a date based on the given activity and fill with random attendance.
   * @param activity The activity for which to generate a concrete event instance
   * @param date The date of the generated event
   */
  static generateEventForActivity(
    activity: RecurringActivity,
    date: Date,
  ): EventNote {
    const eventNote = new EventNote(faker.string.uuid());
    eventNote.date = date;
    eventNote.subject = activity.title;
    eventNote.authors = activity.assignedTo;
    eventNote.category = activity.type;
    eventNote.relatesTo = activity.getId();

    for (const participantId of activity.participants) {
      eventNote.addChild(participantId);
      const eventAtt = eventNote.getAttendance(participantId);
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
    }

    return eventNote;
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

  generateEntities(): EventNote[] {
    const data = [];

    for (const activity of this.demoActivities.entities) {
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
          DemoActivityEventsGeneratorService.generateEventForActivity(
            activity,
            date.toDate(),
          ),
        );
      }
    }

    return data;
  }
}
