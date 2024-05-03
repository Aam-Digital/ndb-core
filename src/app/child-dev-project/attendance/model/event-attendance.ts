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
  static DATA_TYPE = "event-attendance";

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
    remarks: string = "",
  ) {
    this.status = status;
    this.remarks = remarks;
  }

  public copy(): EventAttendance {
    return Object.assign(new EventAttendance(), this);
  }
}

/**
 * A full registry of event-attendance entries for multiple participants.
 *
 * TODO: this class can become the basis for a more generic attendance data that is not hard-wired to Note entities.
 */
export class EventAttendanceMap extends Map<string, EventAttendance> {
  static DATA_TYPE = "event-attendance-map";

  constructor() {
    super();
  }
}
