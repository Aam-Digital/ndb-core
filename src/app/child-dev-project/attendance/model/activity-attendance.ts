import { AttendanceLogicalStatus } from "./attendance-status";
import { RecurringActivity } from "./recurring-activity";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { EventNote } from "./event-note";
import { getWarningLevelColor, WarningLevel } from "../../warning-level";
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

  countEventsPresent(childId: string): number {
    return this.countIndividual(childId, AttendanceLogicalStatus.PRESENT);
  }

  countEventsAbsent(childId: string): number {
    return this.countIndividual(childId, AttendanceLogicalStatus.ABSENT);
  }

  private countIndividual(
    childId: string,
    countingType: AttendanceLogicalStatus,
  ) {
    return this.events.filter(
      (eventNote) =>
        eventNote.getAttendance(childId)?.status.countAs === countingType,
    ).length;
  }

  getAttendancePercentage(childId: string): number {
    const present = this.countEventsPresent(childId);
    const absent = this.countEventsAbsent(childId);

    return present / (present + absent);
  }

  countTotalPresent() {
    return this.countWithStatus(AttendanceLogicalStatus.PRESENT);
  }

  countTotalAbsent() {
    return this.countWithStatus(AttendanceLogicalStatus.ABSENT);
  }

  private countWithStatus(matchingType: AttendanceLogicalStatus) {
    return this.events.reduce(
      (total, event) => total + event.countWithStatus(matchingType),
      0,
    );
  }

  getAttendancePercentageAverage(): number {
    return this.countPercentage(AttendanceLogicalStatus.PRESENT, false);
  }

  private countPercentage(
    matchingType: AttendanceLogicalStatus,
    rounded: boolean = false,
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
        { total: 0, matching: 0 },
      );

    const result = calculatedStats.matching / calculatedStats.total;
    if (rounded) {
      return Math.round(result * 10) / 10;
    } else {
      return result;
    }
  }

  /**
   * The number of events that have at least one participant with an undefined status.
   * This may occur when the user does not complete the full roll call or skips participants.
   * The count of unknown status can indicate if manual checking and corrections are required.
   *
   * @param forChildId filter the calculation to only include status of the given participant id
   */
  countEventsWithUnknownStatus(forChildId?: string): number {
    return this.events
      .filter((e) => !forChildId || e.children.includes(forChildId))
      .reduce(
        (count: number, e: EventNote) =>
          e.hasUnknownAttendances(forChildId) ? count + 1 : count,
        0,
      );
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

  public getColor(forChildId?: string): string {
    return getWarningLevelColor(this.getWarningLevel(forChildId));
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
  participating: (
    | [string, AttendanceLogicalStatus]
    | [string, AttendanceLogicalStatus, string]
  )[],
  date = new Date(),
  activity?: RecurringActivity,
): EventNote {
  const event = EventNote.create(date);
  for (const att of participating) {
    event.addChild(att[0]);
    event.getAttendance(att[0]).status = defaultAttendanceStatusTypes.find(
      (t) => t.countAs === att[1],
    );
    if (att.length === 3) {
      event.getAttendance(att[0]).remarks = att[2];
    }
  }
  event.relatesTo = activity?.getId();
  return event;
}
