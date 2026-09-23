import { AttendanceStatusType } from "#src/app/features/attendance/model/attendance-status";
import demoEnums from "../../demo-data/demo-enums.json";

// kept separate from the shipped config, whose texts can be configured per language
export const defaultAttendanceStatusTypes = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:attendance-status",
).values as AttendanceStatusType[];
