import { Note } from "../../notes/model/note";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "./attendance-status";

export function calculateAverageAttendance(
  event: Note
): {
  average: number;
  unknownStatus: number;
  statusCounts: Map<AttendanceStatusType, number>;
} {
  const stats = new Map<AttendanceLogicalStatus, number>();
  stats.set(AttendanceLogicalStatus.PRESENT, 0);
  stats.set(AttendanceLogicalStatus.ABSENT, 0);
  stats.set(AttendanceLogicalStatus.IGNORE, 0);

  const statusCounts = new Map<AttendanceStatusType, number>();

  for (const childId of event.children) {
    const status = event.getAttendance(childId).status;
    const countStatus = statusCounts.get(status) ?? 0;
    statusCounts.set(status, countStatus + 1);

    const attendanceType = status.countAs;
    const countType = stats.get(attendanceType) ?? 0;
    stats.set(attendanceType, countType + 1);
  }

  return {
    average:
      stats.get(AttendanceLogicalStatus.PRESENT) /
      event.children.length,
    unknownStatus: statusCounts.get(NullAttendanceStatusType.status) ?? 0,
    statusCounts: statusCounts,
  };
}
