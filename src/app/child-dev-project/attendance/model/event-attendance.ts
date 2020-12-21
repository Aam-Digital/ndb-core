import { AttendanceStatus } from "./attendance-status";

/**
 * Simple relationship object to represent an individual child's status at an event including context information.
 */
export class EventAttendance {
  constructor(
    public status: AttendanceStatus = AttendanceStatus.UNKNOWN,
    public remarks: string = ""
  ) {}
}
