import { ComponentTuple } from "#src/app/dynamic-components";

export const attendanceComponents: ComponentTuple[] = [
  [
    "AttendanceManager",
    () =>
      import("./add-day-attendance/attendance-manager/attendance-manager.component").then(
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
    "GroupedChildAttendance",
    () =>
      import("./analysis/grouped-child-attendance/grouped-child-attendance.component").then(
        (c) => c.GroupedChildAttendanceComponent,
      ),
  ],
  [
    "ActivityAttendanceSection",
    () =>
      import("./analysis/activity-attendance-section/activity-attendance-section.component").then(
        (c) => c.ActivityAttendanceSectionComponent,
      ),
  ],
  [
    "AttendanceWeekDashboard",
    () =>
      import("./attendance-week-dashboard/attendance-week-dashboard.component").then(
        (c) => c.AttendanceWeekDashboardComponent,
      ),
  ],
  [
    "EditAttendance",
    () =>
      import("./edit-attendance/edit-attendance.component").then(
        (c) => c.EditAttendanceComponent,
      ),
  ],
  [
    "AttendanceWeekDashboardSettings",
    () =>
      import("./attendance-week-dashboard/attendance-week-dashboard-settings.component/attendance-week-dashboard-settings.component").then(
        (c) => c.AttendanceWeekDashboardSettingsComponent,
      ),
  ],
];
