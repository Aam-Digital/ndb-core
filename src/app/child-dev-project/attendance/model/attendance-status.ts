export enum AttendanceStatus {
  UNKNOWN = "?",
  HOLIDAY = "H",
  ABSENT = "A",
  PRESENT = "P",
  LATE = "L",
  EXCUSED = "E",
}

export class AttendanceStatusType {
  static NONE = {
    status: AttendanceStatus.UNKNOWN,
    name: "?",
    shortName: "?",
    color: "#DDDDDD",
  };

  /**
   * match to enum - can probably be removed once completed moved into config?
   */
  status: AttendanceStatus;

  countAs: AttendanceCounting = AttendanceCounting.IGNORE;

  /** a short (one letter) representation e.g. used in calendar view */
  shortName: string;

  /** a clear, spelled out title of the status */
  name: string;

  /** a color code representing the status */
  color?: string;
}

export enum AttendanceCounting {
  PRESENT,
  ABSENT,
  IGNORE,
}

/**
 * TEMPORARY: standard attendance types; should be moved into config
 */
export const DEFAULT_ATTENDANCE_TYPES = [
  {
    status: AttendanceStatus.PRESENT,
    shortName: "P",
    name: "Present",
    style: "attendance-P",
    countAs: AttendanceCounting.PRESENT,
  },
  {
    status: AttendanceStatus.ABSENT,
    shortName: "A",
    name: "Absent",
    style: "attendance-A",
    countAs: AttendanceCounting.ABSENT,
  },
  {
    status: AttendanceStatus.LATE,
    shortName: "L",
    name: "Late",
    style: "attendance-L",
    countAs: AttendanceCounting.PRESENT,
  },
  {
    status: AttendanceStatus.HOLIDAY,
    shortName: "H",
    name: "Holiday",
    style: "attendance-H",
    countAs: AttendanceCounting.IGNORE,
  },
  {
    status: AttendanceStatus.EXCUSED,
    shortName: "E",
    name: "Excused",
    style: "attendance-E",
    countAs: AttendanceCounting.IGNORE,
  },
  {
    status: AttendanceStatus.UNKNOWN,
    shortName: "?",
    name: "Skip",
    style: "attendance-U",
    countAs: AttendanceCounting.IGNORE,
  },
];
