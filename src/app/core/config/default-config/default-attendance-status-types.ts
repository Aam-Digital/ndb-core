import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../../child-dev-project/attendance/model/attendance-status";

export const defaultAttendanceStatusTypes: AttendanceStatusType[] = [
  {
    id: "PRESENT",
    shortName: "P",
    label: "Present",
    style: "attendance-P",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "ABSENT",
    shortName: "A",
    label: "Absent",
    style: "attendance-A",
    countAs: "ABSENT" as AttendanceLogicalStatus,
  },
  {
    id: "LATE",
    shortName: "L",
    label: "Late",
    style: "attendance-L",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "HOLIDAY",
    shortName: "H",
    label: "Holiday",
    style: "attendance-H",
    countAs: "IGNORE" as AttendanceLogicalStatus,
  },
  {
    id: "EXCUSED",
    shortName: "E",
    label: "Excused",
    style: "attendance-E",
    countAs: "IGNORE" as AttendanceLogicalStatus,
  },
];
