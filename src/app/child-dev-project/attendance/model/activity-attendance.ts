import { Note } from "../../notes/model/note";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "./attendance-status";
import { Entity } from "../../../core/entity/entity";
import { RecurringActivity } from "./recurring-activity";

/**
 * Aggregate information about all events for a {@link RecurringActivity} within a given time period.
 *
 * This object is not saved in the database but instead generated dynamically from stored Events
 * to avoid problems keeping all information in sync in the database.
 */
export class ActivityAttendance extends Entity {
  /**
   * Create an instance with the given initial properties.
   */
  static create(from: Date, events: Note[] = []) {
    const instance = new ActivityAttendance();
    instance.periodFrom = from;
    instance.events = events;
    return instance;
  }

  /**
   * Starting date of the period this data refers to
   */
  periodFrom: Date;
  /**
   * End date of the period this data refers to
   */
  periodTo: Date;

  /**
   * Events within the period relating to the activity
   */
  events: Note[] = [];

  /**
   * The general, recurring activity for which this instance aggregates actual events that took place within a limited time period.
   */
  activity: RecurringActivity;

  countEventsTotal(): number {
    return this.events.length;
  }

  countEventsWithStatusForChild(
    status: AttendanceStatusType,
    childId: string
  ): number {
    return this.events.reduce(
      (prev: number, currentEvent: Note) =>
        currentEvent.getAttendance(childId)?.status === status
          ? prev + 1
          : prev,
      0
    );
  }

  countEventsWithUnknownStatus(): number {
    return this.events.reduce(
      (prev: number, currentEvent: Note) =>
        currentEvent.hasUnknownAttendances() ? prev + 1 : prev,
      0
    );
  }

  countEventsPresent(childId: string): number {
    return this.countIndividual(childId, AttendanceLogicalStatus.PRESENT);
  }

  countEventsAbsent(childId: string): number {
    return this.countIndividual(childId, AttendanceLogicalStatus.ABSENT);
  }

  getAttendancePercentage(childId: string) {
    const present = this.countEventsPresent(childId);
    const absent = this.countEventsAbsent(childId);

    return present / (present + absent);
  }

  getAttendancePercentageAverage() {
    // TODO calculate overall averaged attendance percentage
    return NaN;
  }

  countEventsPresentAverage(rounded: boolean = false) {
    return this.countAverage(AttendanceLogicalStatus.PRESENT, rounded);
  }

  countEventsAbsentAverage(rounded: boolean = false) {
    return this.countAverage(AttendanceLogicalStatus.ABSENT, rounded);
  }

  private countIndividual(
    childId: string,
    countingType: AttendanceLogicalStatus
  ) {
    return this.events.filter(
      (eventNote) =>
        eventNote.getAttendance(childId)?.status.countAs === countingType
    ).length;
  }

  private countAverage(
    matchingType: AttendanceLogicalStatus,
    rounded: boolean = false
  ) {
    const calculatedStats = this.events
      .map((event) => {
        const eventStats = {
          matching: 0,
          total: event.children.length,
        };
        for (const childId of event.children) {
          const att = event.getAttendance(childId).status;
          if (att.countAs === matchingType) {
            eventStats.matching++;
          } else if (att.countAs === AttendanceLogicalStatus.IGNORE) {
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

    const result =
      calculatedStats.matching / (calculatedStats.total / this.events.length);
    if (rounded) {
      return Math.round(result * 10) / 10;
    } else {
      return result;
    }
  }
}

let defaultAttendanceTypes: AttendanceStatusType[];
/**
 * Generate a event with children for the given AttendanceStatus array.
 *
 * This is particularly useful to generate simple data for demo or test purposes.
 *
 * @param participating Object where keys are string childId and values are its attendance status
 * @param date (Optional) date of the event; if not given today's date is used
 */
export function generateEventWithAttendance(
  participating: { [key: string]: AttendanceLogicalStatus },
  date = new Date()
): Note {
  if (!defaultAttendanceTypes) {
    defaultAttendanceTypes = [
      {
        id: "PRESENT",
        label: "Present",
        countAs: AttendanceLogicalStatus.PRESENT,
      },
      {
        id: "ABSENT",
        label: "Absent",
        countAs: AttendanceLogicalStatus.ABSENT,
      },
      {
        id: "SKIP",
        label: "Skip",
        countAs: AttendanceLogicalStatus.IGNORE,
      },
    ] as AttendanceStatusType[];
  }

  const event = Note.create(date);
  for (const childId of Object.keys(participating)) {
    event.addChild(childId);
    event.getAttendance(childId).status = defaultAttendanceTypes.find(
      (t) => t.countAs === participating[childId]
    );
  }
  return event;
}
