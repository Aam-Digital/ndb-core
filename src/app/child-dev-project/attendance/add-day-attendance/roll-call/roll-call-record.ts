import { Child } from '../../../children/model/child';
import { AttendanceDay } from '../../model/attendance-day';
import { AttendanceMonth } from '../../model/attendance-month';

export interface RollCallRecord {
  child: Child;
  attendanceDay: AttendanceDay;
  attendanceMonth: AttendanceMonth;
}
