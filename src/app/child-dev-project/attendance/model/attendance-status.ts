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

  /** a short (one letter) representation e.g. used in calendar view */
  shortName: string;

  /** a clear, spelled out title of the status */
  name: string;

  /** a color code representing the status */
  color?: string;
}
