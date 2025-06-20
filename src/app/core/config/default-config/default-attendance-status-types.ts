import { AttendanceStatusType } from "../../../child-dev-project/attendance/model/attendance-status";
import enumJson from "../../../../assets/base-configs/basic/ConfigurableEnum_attendance-status.json";

export const defaultAttendanceStatusTypes =
  enumJson.values as AttendanceStatusType[];
