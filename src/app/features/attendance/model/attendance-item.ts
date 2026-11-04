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
  declare static schema: EntitySchema;

  // declared first, so that the participant comes first in generic lists of the inner fields (e.g. exports)
  @DatabaseField({
    dataType: "entity",
    label: $localize`:Attendance embedded field label:Participant`,
  })
  participant?: string;

  private _status: AttendanceStatusType;
  @DatabaseField({
    label: $localize`:Attendance status field label:Status`,
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
    label: $localize`:Attendance remarks field label:Remarks`,
  })
  remarks: string;

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
