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
    style: "attendance-U",
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

  /** a css class with styling related to the status */
  style?: string;
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
