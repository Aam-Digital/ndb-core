import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../../child-dev-project/attendance/model/attendance-status";

export const defaultAttendanceStatusTypes: AttendanceStatusType[] = [
  {
    id: "PRESENT",
    shortName: "P",
    label: $localize`:Child was present|Option in roll call:Present`,
    style: "attendance-P",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "ABSENT",
    shortName: "A",
    label: $localize`:Child was absent|Option in roll call:Absent`,
    style: "attendance-A",
    countAs: "ABSENT" as AttendanceLogicalStatus,
  },
  {
    id: "LATE",
    shortName: "L",
    label: $localize`:Child was late|Option in roll call:Late`,
    style: "attendance-L",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "EXCUSED",
    shortName: "E",
    label: $localize`:Child was excused|Option in roll call:Excused`,
    style: "attendance-E",
    countAs: "IGNORE" as AttendanceLogicalStatus,
  },
];
