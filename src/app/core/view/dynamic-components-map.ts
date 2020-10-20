import { AttendanceAverageDashboardComponent } from "app/child-dev-project/attendance/dashboard-widgets/attendance-average-dashboard/attendance-average-dashboard.component";
import { AttendanceWarningsDashboardComponent } from "app/child-dev-project/attendance/dashboard-widgets/attendance-warnings-dashboard/attendance-warnings-dashboard.component";
import { AttendanceWeekDashboardComponent } from "app/child-dev-project/attendance/dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component";
import { ChildrenCountDashboardComponent } from "app/child-dev-project/children/children-count-dashboard/children-count-dashboard.component";
import { NoRecentNotesDashboardComponent } from "app/child-dev-project/notes/dashboard-widgets/no-recent-notes-dashboard/no-recent-notes-dashboard.component";
import { RecentNotesDashboardComponent } from "app/child-dev-project/notes/dashboard-widgets/recent-notes-dashboard/recent-notes-dashboard.component";
import { ProgressDashboardComponent } from "../../child-dev-project/progress-dashboard-widget/progress-dashboard/progress-dashboard.component";

export const DYNAMIC_COMPONENTS_MAP = new Map<string, any>([
  ["ChildrenCountDashboard", ChildrenCountDashboardComponent],
  ["RecentNotesDashboard", RecentNotesDashboardComponent],
  ["NoRecentNotesDashboard", NoRecentNotesDashboardComponent],
  ["AttendanceWeekDashboard", AttendanceWeekDashboardComponent],
  ["ProgressDashboard", ProgressDashboardComponent],
  ["AttendanceAverageDashboard", AttendanceAverageDashboardComponent],
  ["AttendanceWarningsDashboard", AttendanceWarningsDashboardComponent],
]);
