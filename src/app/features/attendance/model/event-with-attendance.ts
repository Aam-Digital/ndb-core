import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceItem } from "./attendance-item";

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

  getAttendanceForParticipant(
    participantId: string,
  ): AttendanceItem | undefined {
    return this.attendanceItems.find(
      (item) => item.participant === participantId,
    );
  }
}
