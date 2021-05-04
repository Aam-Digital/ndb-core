import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../../child-dev-project/attendance/model/attendance-status";

export const defaultAttendanceStatusTypes: AttendanceStatusType[] = [
  {
    id: "PRESENT",
    shortName: "P",
    label: $localize`:Child was present:Present`,
    style: "attendance-P",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "ABSENT",
    shortName: "A",
    label: $localize`:Child was absent:Absent`,
    style: "attendance-A",
    countAs: "ABSENT" as AttendanceLogicalStatus,
  },
  {
    id: "LATE",
    shortName: "L",
    label: $localize`:Child was late:Late`,
    style: "attendance-L",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "HOLIDAY",
    shortName: "H",
    label: $localize`:Child was on holliday:Holiday`,
    style: "attendance-H",
    countAs: "IGNORE" as AttendanceLogicalStatus,
  },
  {
    id: "EXCUSED",
    shortName: "E",
    label: $localize`:Child was excused:Excused`,
    style: "attendance-E",
    countAs: "IGNORE" as AttendanceLogicalStatus,
  },
];
