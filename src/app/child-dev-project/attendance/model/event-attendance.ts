import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "./attendance-status";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

/**
 * Simple relationship object to represent an individual child's status at an event including context information.
 */
export class EventAttendance {
  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: ATTENDANCE_STATUS_CONFIG_ID,
  })
  status: AttendanceStatusType;

  @DatabaseField() remarks: string;

  constructor(
    status: AttendanceStatusType = NullAttendanceStatusType,
    remarks: string = ""
  ) {
    this.status = status;
    this.remarks = remarks;
  }
}
