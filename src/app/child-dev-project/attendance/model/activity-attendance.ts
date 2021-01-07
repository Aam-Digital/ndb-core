import { Note } from "../../notes/model/note";
import {
  AttendanceCounting,
  AttendanceStatus,
  DEFAULT_ATTENDANCE_TYPES,
} from "./attendance-status";
import { Entity } from "../../../core/entity/entity";
import { RecurringActivity } from "./recurring-activity";

export class ActivityAttendance extends Entity {
  static create(from: Date, events: Note[] = []) {
    const instance = new ActivityAttendance();
    instance.periodFrom = from;
    instance.events = events;
    return instance;
  }

  periodFrom: Date;
  periodTo: Date;

  events: Note[] = [];

  activity: RecurringActivity;

  /**
   * childId to be used as default when getting statistics through the instance's methods (e.g. getEventsPresent)
   *
   * if `focusedChild` is set and a method like `getEventsPresent()` is called without parameter
   * the focusedChild is used as parameter implicitly to simplify calling these methods in templates.
   */
  focusedChild: string;

  getEventsTotal(): number {
    return this.events.length;
  }

  getEventsWithStatus(
    status: AttendanceStatus,
    childId: string = this.focusedChild
  ): number {
    return this.events.reduce(
      (prev: number, currentEvent: Note) =>
        currentEvent.getAttendance(childId)?.status === status
          ? prev + 1
          : prev,
      0
    );
  }

  getEventsPresent(childId: string = this.focusedChild): number {
    if (!childId) {
      return this.getEventsPresentAverage();
    }

    return this.countIndividual(childId, AttendanceCounting.PRESENT);
  }

  getEventsAbsent(childId: string = this.focusedChild): number {
    if (!childId) {
      return this.getEventsAbsentAverage();
    }

    return this.countIndividual(childId, AttendanceCounting.ABSENT);
  }

  getAttendancePercentage(childId: string = this.focusedChild) {
    const present = this.getEventsPresent(childId);
    const absent = this.getEventsAbsent(childId);

    return present / (present + absent);
  }

  getAttendancePercentageAverage() {
    // TODO calculate overall averaged attendance percentage
    return -1;
  }

  getEventsPresentAverage() {
    return this.countAverage(AttendanceCounting.PRESENT);
  }

  getEventsAbsentAverage() {
    return this.countAverage(AttendanceCounting.ABSENT);
  }

  private countIndividual(childId: string, countingType: AttendanceCounting) {
    return this.events.filter(
      (eventNote) =>
        getAttendanceType(eventNote.getAttendance(childId)?.status)?.countAs ===
        countingType
    ).length;
  }

  private countAverage(matchingType: AttendanceCounting) {
    const calculatedStats = this.events
      .map((event) => {
        const eventStats = {
          matching: 0,
          total: event.children.length,
        };
        for (const childId of event.children) {
          const att = getAttendanceType(event.getAttendance(childId).status);
          if (att.countAs === matchingType) {
            eventStats.matching++;
          } else if (att.countAs === AttendanceCounting.IGNORE) {
            eventStats.total--;
          }
        }

        return eventStats;
      })
      .reduce(
        (accumulatedStats, currentEventStats) => {
          accumulatedStats.total += currentEventStats.total;
          accumulatedStats.matching += currentEventStats.matching;
          return accumulatedStats;
        },
        { total: 0, matching: 0 }
      );

    return (
      calculatedStats.matching / (calculatedStats.total / this.events.length)
    );
  }
}

// TODO: remove once EventAttendance contains the full reference to AttendanceStatusType after that was moved into config
export function getAttendanceType(status: AttendanceStatus) {
  return DEFAULT_ATTENDANCE_TYPES.find((t) => t.status === status);
}

/**
 * Generate a event with children for the given AttendanceStatus array.
 *
 * This is particularly useful to generate simple data for demo or test purposes.
 *
 * @param participating Object where keys are string childId and values are its attendance status
 * @param date (Optional) date of the event; if not given today's date is used
 */
export function generateEventWithAttendance(
  participating: { [key: string]: AttendanceStatus },
  date = new Date()
): Note {
  const event = Note.create(date);
  for (const childId of Object.keys(participating)) {
    event.addChild(childId);
    event.getAttendance(childId).status = participating[childId];
  }
  return event;
}
