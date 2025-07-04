import { ComponentTuple } from "../../dynamic-components";

export const attendanceComponents: ComponentTuple[] = [
  [
    "AttendanceManager",
    () =>
      import("./attendance-manager/attendance-manager.component").then(
        (c) => c.AttendanceManagerComponent,
      ),
  ],
  [
    "AddDayAttendance",
    () =>
      import("./add-day-attendance/add-day-attendance.component").then(
        (c) => c.AddDayAttendanceComponent,
      ),
  ],
  [
    "ActivityAttendanceSection",
    () =>
      import(
        "./activity-attendance-section/activity-attendance-section.component"
      ).then((c) => c.ActivityAttendanceSectionComponent),
  ],
  [
    "AttendanceWeekDashboard",
    () =>
      import(
        "./dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component"
      ).then((c) => c.AttendanceWeekDashboardComponent),
  ],
  [
    "EditAttendance",
    () =>
      import("./edit-attendance/edit-attendance.component").then(
        (c) => c.EditAttendanceComponent,
      ),
  ],
];
