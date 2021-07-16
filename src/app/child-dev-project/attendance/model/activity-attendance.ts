import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "./attendance-status";
import { RecurringActivity } from "./recurring-activity";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { EventNote } from "./event-note";
import { WarningLevel } from "../../../core/entity/model/warning-level";
import { Entity } from "../../../core/entity/model/entity";

/**
 * Aggregate information about all events for a {@link RecurringActivity} within a given time period.
 *
 * This object is not saved in the database but instead generated dynamically from stored Events
 * to avoid problems keeping all information in sync in the database.
 */
export class ActivityAttendance extends Entity {
  static readonly THRESHOLD_URGENT = 0.6;
  static readonly THRESHOLD_WARNING = 0.8;

  /**
   * Create an instance with the given initial properties.
   */
  static create(from: Date, events: EventNote[] = []) {
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
  private _events: EventNote[] = [];

  set events(value: EventNote[]) {
    this._events = value;
    this.recalculateStats();
  }
  get events(): EventNote[] {
    return this._events;
  }

  /**
   * The general, recurring activity for which this instance aggregates actual events that took place within a limited time period.
   */
  activity: RecurringActivity;

  /**
   * Mapping child ids to a map with all *logical* status as object keys and their counts as values.
   */
  individualLogicalStatusCounts = new Map<
    string,
    { [key in AttendanceLogicalStatus]?: number }
  >();

  /**
   * Mapping child ids to a map with all status type ids as object keys and their counts as values.
   */
  individualStatusTypeCounts = new Map<string, { [key: string]: number }>();

  countEventsTotal(): number {
    return this.events.length;
  }

  countEventsWithStatusForChild(
    status: AttendanceStatusType,
    childId: string
  ): number {
    return this.events.reduce(
      (prev: number, currentEvent: EventNote) =>
        currentEvent.getAttendance(childId)?.status === status
          ? prev + 1
          : prev,
      0
    );
  }

  countEventsWithUnknownStatus(): number {
    return this.events.reduce(
      (prev: number, currentEvent: EventNote) =>
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

  getAttendancePercentage(childId: string): number {
    const present = this.countEventsPresent(childId);
    const absent = this.countEventsAbsent(childId);

    return present / (present + absent);
  }

  getAttendancePercentageAverage(): number {
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

  recalculateStats() {
    this.individualStatusTypeCounts = new Map();
    this.individualLogicalStatusCounts = new Map();

    for (const event of this.events) {
      for (const participant of event.children) {
        let logicalCount = this.individualLogicalStatusCounts.get(participant);
        if (!logicalCount) {
          logicalCount = {};
          this.individualLogicalStatusCounts.set(participant, logicalCount);
        }
        let typeCount = this.individualStatusTypeCounts.get(participant);
        if (!typeCount) {
          typeCount = {};
          this.individualStatusTypeCounts.set(participant, typeCount);
        }

        const att = event.getAttendance(participant);
        logicalCount[att.status.countAs] =
          (logicalCount[att.status.countAs] ?? 0) + 1;
        typeCount[att.status.id] = (typeCount[att.status.id] ?? 0) + 1;
      }
    }
  }

  /**
   * Custom warning level for attendance thresholds - optionally for a specific child.
   */
  public getWarningLevel(forChildId?: string): WarningLevel {
    let attendancePercentage;
    if (forChildId) {
      attendancePercentage = this.getAttendancePercentage(forChildId);
    } else {
      attendancePercentage = this.getAttendancePercentageAverage();
    }

    if (!attendancePercentage) {
      return WarningLevel.NONE;
    } else if (attendancePercentage < ActivityAttendance.THRESHOLD_URGENT) {
      return WarningLevel.URGENT;
    } else if (attendancePercentage < ActivityAttendance.THRESHOLD_WARNING) {
      return WarningLevel.WARNING;
    } else {
      return WarningLevel.OK;
    }
  }
}

/**
 * Generate a event with children for the given AttendanceStatus array.
 *
 * This is particularly useful to generate simple data for demo or test purposes.
 *
 * @param participating Object where keys are string childId and values are its attendance status
 * @param date (Optional) date of the event; if not given today's date is used
 * @param activity (Optional) reference to the connected activity entity
 */
export function generateEventWithAttendance(
  participating: [string, AttendanceLogicalStatus][],
  date = new Date(),
  activity?: RecurringActivity
): EventNote {
  const event = EventNote.create(date);
  for (const att of participating) {
    event.addChild(att[0]);
    event.getAttendance(att[0]).status = defaultAttendanceStatusTypes.find(
      (t) => t.countAs === att[1]
    );
  }
  event.relatesTo = activity?._id;
  return event;
}
