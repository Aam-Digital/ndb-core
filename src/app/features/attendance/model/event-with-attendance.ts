import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceItem } from "./attendance-item";
import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "./attendance-status";

export interface AttendanceStats {
  average: number;
  counted: number;
  excludedUnknown: number;
  statusCounts: Map<string, number>;
  logicalStatusCounts: Map<string, number>;
}

/**
 * Adapter wrapping an event entity with typed accessors for attendance and date fields.
 *
 * This is a runtime-only object — it is NOT persisted in the database.
 * It combines an event entity with the configuration needed to read attendance-specific fields,
 * avoiding the need to pass `attendanceField`/`dateField` strings as separate parameters
 * through component trees.
 */
export class EventWithAttendance {
  constructor(
    readonly entity: Entity,
    readonly attendanceField: string,
    readonly dateField: string,
    readonly relatesToField: string = "relatesTo",
    readonly assignedUsersField: string = "authors",
    readonly extraField: string = "",
  ) {}

  get date(): Date | undefined {
    return this.entity[this.dateField] as Date | undefined;
  }

  get attendanceItems(): AttendanceItem[] {
    return (this.entity[this.attendanceField] as AttendanceItem[]) ?? [];
  }

  set attendanceItems(value: AttendanceItem[]) {
    this.entity[this.attendanceField] = value;
  }

  /**
   * The ID of the parent activity this event belongs to, if any.
   * Corresponds to the `relatesTo` field (or the configured `relatesToField`).
   */
  get activityId(): string | undefined {
    return (
      (this.entity[this.relatesToField] as string | undefined) || undefined
    );
  }

  /** Whether this event belongs to a parent activity. */
  get isActivityEvent(): boolean {
    return !!this.activityId;
  }

  /**
   * The users assigned to / responsible for this event.
   * Corresponds to the `authors` field (or the configured `authorsField`).
   */
  get assignedUsers(): string[] {
    return (this.entity[this.assignedUsersField] as string[]) ?? [];
  }

  getAttendanceForParticipant(
    participantId: string,
  ): AttendanceItem | undefined {
    return this.attendanceItems.find(
      (item) => item.participant === participantId,
    );
  }

  getAttendanceStats(): AttendanceStats {
    const logicalStatusCounts = new Map<AttendanceLogicalStatus, number>();
    logicalStatusCounts.set(AttendanceLogicalStatus.PRESENT, 0);
    logicalStatusCounts.set(AttendanceLogicalStatus.ABSENT, 0);
    logicalStatusCounts.set(AttendanceLogicalStatus.IGNORE, 0);

    const statusCounts = new Map<string, number>();

    for (const item of this.attendanceItems) {
      const status = item.status;
      statusCounts.set(status?.id, (statusCounts.get(status?.id) ?? 0) + 1);

      const countAs = status?.countAs ?? AttendanceLogicalStatus.IGNORE;
      logicalStatusCounts.set(
        countAs,
        (logicalStatusCounts.get(countAs) ?? 0) + 1,
      );
    }

    const counted =
      logicalStatusCounts.get(AttendanceLogicalStatus.PRESENT) +
      logicalStatusCounts.get(AttendanceLogicalStatus.ABSENT);
    return {
      average:
        logicalStatusCounts.get(AttendanceLogicalStatus.PRESENT) / counted,
      counted,
      excludedUnknown: statusCounts.get(NullAttendanceStatusType.id) ?? 0,
      statusCounts,
      logicalStatusCounts,
    };
  }
}
