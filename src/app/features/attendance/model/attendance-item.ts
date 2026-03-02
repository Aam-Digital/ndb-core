import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "./attendance-status";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";

/**
 * Simple relationship object to represent an individual participant's status at an event including context information.
 */
export class AttendanceItem {
  static DATA_TYPE = "event-attendance";
  declare static schema: EntitySchema;

  private _status: AttendanceStatusType;
  @DatabaseField({
    dataType: "configurable-enum",
    additional: ATTENDANCE_STATUS_CONFIG_ID,
  })
  get status(): AttendanceStatusType {
    return this._status;
  }

  set status(value) {
    if (typeof value === "object") {
      if (value.isInvalidOption && !value.id) {
        // empty id means "no status" — normalize to the canonical NullAttendanceStatusType
        // so the value stays consistent after a database round-trip
        this._status = NullAttendanceStatusType;
      } else if (value.isInvalidOption) {
        value.shortName = "?";
        value.countAs = NullAttendanceStatusType.countAs;
        this._status = value;
      } else {
        this._status = value;
      }
    } else {
      this._status = NullAttendanceStatusType;
    }
  }

  @DatabaseField({
    dataType: "entity",
  })
  participant?: string;

  @DatabaseField() remarks: string;

  constructor(
    status: AttendanceStatusType = NullAttendanceStatusType,
    remarks: string = "",
    participant?: string,
  ) {
    this.status = status;
    this.remarks = remarks;
    if (participant) {
      this.participant = participant;
    }
  }

  public copy(): AttendanceItem {
    return Object.assign(new AttendanceItem(), this);
  }
}

/**
 * Find the attendance item for the given participant.
 * Returns undefined if no entry exists for that participant.
 */
export function getAttendance(
  attendanceItems: AttendanceItem[],
  participantId: string,
): AttendanceItem | undefined {
  const attendance = attendanceItems.find(
    (item) => item.participant === participantId,
  );
  if (!attendance) {
    return undefined;
  }
  if (!(attendance instanceof AttendanceItem)) {
    return Object.assign(new AttendanceItem(), attendance);
  }
  return attendance;
}

/**
 * Find or create an attendance item for the given participant.
 * If no entry exists, a new one with default status is created and appended to the array.
 */
export function getOrCreateAttendance(
  attendanceItems: AttendanceItem[],
  participantId: string,
): AttendanceItem {
  let attendance = getAttendance(attendanceItems, participantId);
  if (!attendance) {
    attendance = new AttendanceItem(undefined, "", participantId);
    attendanceItems.push(attendance);
  }
  return attendance;
}
