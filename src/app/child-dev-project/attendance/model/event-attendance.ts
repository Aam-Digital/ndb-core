import { AttendanceStatus } from "./attendance-status";

/**
 * Simple relationship object to link a Child with an Event instance including context information.
 */
export class EventAttendance {
  constructor(
    public childId: string,
    public status: AttendanceStatus = AttendanceStatus.UNKNOWN,
    public remarks: string = ""
  ) {}
}
