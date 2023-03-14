import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "./attendance-status";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

/**
 * Simple relationship object to represent an individual child's status at an event including context information.
 * TODO overwork this concept to either be a sublass of Entity or not (at the moment it uses a lot of casting, e.g. to be used in the entity subrecord)
 */
export class EventAttendance {
  private _status: AttendanceStatusType;
  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: ATTENDANCE_STATUS_CONFIG_ID,
  })
  get status(): AttendanceStatusType {
    return this._status;
  }

  set status(value) {
    if (typeof value === "object") {
      if (value.isInvalidOption) {
        value.shortName = "?";
        value.countAs = NullAttendanceStatusType.countAs;
      }
      this._status = value;
    } else {
      this._status = NullAttendanceStatusType;
    }
  }

  @DatabaseField() remarks: string;

  constructor(
    status: AttendanceStatusType = NullAttendanceStatusType,
    remarks: string = ""
  ) {
    this.status = status;
    this.remarks = remarks;
  }

  public copy(): EventAttendance {
    return Object.assign(new EventAttendance(), this);
  }
}
