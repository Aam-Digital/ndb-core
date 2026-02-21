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

  public copy(): AttendanceItem {
    return Object.assign(new AttendanceItem(), this);
  }
}

/**
 * A full registry of event-attendance entries for multiple participants.
 *
 * TODO: this class can become the basis for a more generic attendance data that is not hard-wired to Note entities.
 */
export class EventAttendanceMap extends Map<string, AttendanceItem> {
  static DATA_TYPE = "event-attendance-map";

  constructor() {
    super();
  }
}
