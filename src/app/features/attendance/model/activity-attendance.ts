import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "./attendance-status";
import {
  getWarningLevelColor,
  WarningLevel,
} from "#src/app/child-dev-project/warning-level";
import { Entity } from "#src/app/core/entity/model/entity";
import { EventWithAttendance } from "./event-with-attendance";

/**
 * Aggregate information about all events for a "recurring activity" within a given time period.
 *
 * This object is not saved in the database but instead generated dynamically from stored Events
 * to avoid problems keeping all information in sync in the database.
 */
export class ActivityAttendance extends Entity {
  static readonly THRESHOLD_URGENT = 0.6;
  static readonly THRESHOLD_WARNING = 0.8;

  /**
   * Create an instance with the given initial properties.
   * @param from Start date of the period
   * @param events Events within this period
   */
  static create(from: Date, events: EventWithAttendance[] = []) {
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
  private _events: EventWithAttendance[] = [];

  set events(value: EventWithAttendance[]) {
    this._events = value;
    this.recalculateStats();
  }

  get events(): EventWithAttendance[] {
    return this._events;
  }

  /**
   * The general, recurring activity for which this instance aggregates actual events that took place within a limited time period.
   */
  activity: Entity;

  /**
   * List of (actual, recorded in at least one event) participants.
   */
  get participants(): string[] {
    return Array.from(
      new Set(
        this.events.flatMap((event) =>
          event.attendanceItems
            .map((item) => item.participant)
            .filter((p): p is string => !!p),
        ),
      ),
    );
  }

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
      (event) =>
        event.getAttendanceForParticipant(childId)?.status.countAs ===
        countingType,
    ).length;
  }

  getAttendancePercentage(childId: string): number | undefined {
    const present = this.countEventsPresent(childId);
    const absent = this.countEventsAbsent(childId);
    const total = present + absent;

    return total > 0 ? present / total : undefined;
  }

  countTotalPresent() {
    return this.countWithStatus(AttendanceLogicalStatus.PRESENT);
  }

  countTotalAbsent() {
    return this.countWithStatus(AttendanceLogicalStatus.ABSENT);
  }

  private countWithStatus(matchingType: AttendanceLogicalStatus) {
    return this.events.reduce(
      (total, event) =>
        total +
        event.attendanceItems.filter(
          (item) => item.status.countAs === matchingType,
        ).length,
      0,
    );
  }

  getAttendancePercentageAverage(): number | undefined {
    return this.countPercentage(AttendanceLogicalStatus.PRESENT, false);
  }

  private countPercentage(
    matchingType: AttendanceLogicalStatus,
    rounded: boolean = false,
  ) {
    const calculatedStats = this.events
      .map((event) => {
        const items = event.attendanceItems;
        const eventStats = {
          matching: 0,
          total: items.length,
        };
        for (const item of items) {
          const att = item.status;
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

    if (calculatedStats.total === 0) {
      return undefined;
    }

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
      .filter(
        (e) =>
          !forChildId ||
          e.attendanceItems.some((item) => item.participant === forChildId),
      )
      .reduce((count: number, e: EventWithAttendance) => {
        const items = forChildId
          ? [e.getAttendanceForParticipant(forChildId)].filter(Boolean)
          : e.attendanceItems;
        const hasUnknown = items.some(
          (item) => item.status.id === NullAttendanceStatusType.id,
        );
        return hasUnknown ? count + 1 : count;
      }, 0);
  }

  recalculateStats() {
    this.individualStatusTypeCounts = new Map();
    this.individualLogicalStatusCounts = new Map();

    for (const event of this.events) {
      for (const item of event.attendanceItems) {
        const participant = item.participant;
        if (!participant) continue;

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

        const att = item.status;
        logicalCount[att.countAs] = (logicalCount[att.countAs] ?? 0) + 1;
        typeCount[att.id] = (typeCount[att.id] ?? 0) + 1;
      }
    }
  }

  /**
   * Custom warning level for attendance thresholds - optionally for a specific child.
   */
  public override getWarningLevel(forChildId?: string): WarningLevel {
    let attendancePercentage;
    if (forChildId) {
      attendancePercentage = this.getAttendancePercentage(forChildId);
    } else {
      attendancePercentage = this.getAttendancePercentageAverage();
    }

    if (attendancePercentage === undefined) {
      return WarningLevel.NONE;
    } else if (attendancePercentage < ActivityAttendance.THRESHOLD_URGENT) {
      return WarningLevel.URGENT;
    } else if (attendancePercentage < ActivityAttendance.THRESHOLD_WARNING) {
      return WarningLevel.WARNING;
    } else {
      return WarningLevel.OK;
    }
  }

  public override getColor(forChildId?: string): string {
    return getWarningLevelColor(this.getWarningLevel(forChildId));
  }
}
