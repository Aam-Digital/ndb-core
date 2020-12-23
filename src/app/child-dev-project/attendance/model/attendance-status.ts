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
    color: "#C8E6C9",
    countAs: AttendanceCounting.PRESENT,
  },
  {
    status: AttendanceStatus.ABSENT,
    shortName: "A",
    name: "Absent",
    color: "#FF8A65",
    countAs: AttendanceCounting.ABSENT,
  },
  {
    status: AttendanceStatus.LATE,
    shortName: "L",
    name: "Late",
    color: "#FFECB3",
    countAs: AttendanceCounting.PRESENT,
  },
  {
    status: AttendanceStatus.HOLIDAY,
    shortName: "H",
    name: "Holiday",
    color: "#CFD8DC",
    countAs: AttendanceCounting.IGNORE,
  },
  {
    status: AttendanceStatus.EXCUSED,
    shortName: "E",
    name: "Excused",
    color: "#D7CCC8",
    countAs: AttendanceCounting.IGNORE,
  },
  {
    status: AttendanceStatus.UNKNOWN,
    shortName: "?",
    name: "Skip",
    color: "#DDDDDD",
    countAs: AttendanceCounting.IGNORE,
  },
];
