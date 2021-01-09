import { Note } from "../../notes/model/note";
import {
  AttendanceCounting,
  AttendanceStatus,
  AttendanceStatusType,
} from "./attendance-status";
import { getAttendanceType } from "./activity-attendance";

export function calculateAverageAttendance(
  event: Note
): {
  average: number;
  unknownStatus: number;
  statusCounts: Map<AttendanceStatus, number>;
} {
  const stats = new Map<AttendanceCounting, number>();
  stats.set(AttendanceCounting.PRESENT, 0);
  stats.set(AttendanceCounting.ABSENT, 0);
  stats.set(AttendanceCounting.IGNORE, 0);

  const statusCounts = new Map<AttendanceStatus, number>();

  for (const childId of event.children) {
    const status = event.getAttendance(childId).status;
    const countStatus = statusCounts.get(status) ?? 0;
    statusCounts.set(status, countStatus + 1);

    const attendanceType = getAttendanceType(status).countAs;
    const countType = stats.get(attendanceType) ?? 0;
    stats.set(attendanceType, countType + 1);
  }

  return {
    average:
      stats.get(AttendanceCounting.PRESENT) /
      (stats.get(AttendanceCounting.PRESENT) +
        stats.get(AttendanceCounting.ABSENT)),
    unknownStatus: statusCounts.get(AttendanceStatusType.NONE.status) ?? 0,
    statusCounts: statusCounts,
  };
}
