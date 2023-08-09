import { Note } from "../../notes/model/note";
import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "./attendance-status";

export interface AverageAttendanceStats {
  average: number;
  counted: number;
  excludedUnknown: number;
  statusCounts: Map<string, number>;
  logicalStatusCounts: Map<string, number>;
}

export function calculateAverageAttendance(
  event: Note,
): AverageAttendanceStats {
  const stats = new Map<AttendanceLogicalStatus, number>();
  stats.set(AttendanceLogicalStatus.PRESENT, 0);
  stats.set(AttendanceLogicalStatus.ABSENT, 0);
  stats.set(AttendanceLogicalStatus.IGNORE, 0);

  const statusCounts = new Map<string, number>();

  for (const childId of event.children) {
    const status = event.getAttendance(childId).status;
    const countStatus = statusCounts.get(status?.id) ?? 0;
    statusCounts.set(status?.id, countStatus + 1);

    const attendanceType = status?.countAs ?? AttendanceLogicalStatus.IGNORE;
    const countType = stats.get(attendanceType) ?? 0;
    stats.set(attendanceType, countType + 1);
  }

  const countedForAverage =
    stats.get(AttendanceLogicalStatus.PRESENT) +
    stats.get(AttendanceLogicalStatus.ABSENT);
  return {
    average: stats.get(AttendanceLogicalStatus.PRESENT) / countedForAverage,
    counted: countedForAverage,
    excludedUnknown: statusCounts.get(NullAttendanceStatusType.id) ?? 0,
    statusCounts: statusCounts,
    logicalStatusCounts: stats,
  };
}
