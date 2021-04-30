import { AttendanceWeekDashboardComponent } from "../../child-dev-project/attendance/dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component";
import { ChildrenCountDashboardComponent } from "../../child-dev-project/children/children-count-dashboard/children-count-dashboard.component";
import { NoRecentNotesDashboardComponent } from "../../child-dev-project/notes/dashboard-widgets/no-recent-notes-dashboard/no-recent-notes-dashboard.component";
import { RecentNotesDashboardComponent } from "../../child-dev-project/notes/dashboard-widgets/recent-notes-dashboard/recent-notes-dashboard.component";
import { ProgressDashboardComponent } from "../../child-dev-project/progress-dashboard-widget/progress-dashboard/progress-dashboard.component";
import { PreviousSchoolsComponent } from "../../child-dev-project/previous-schools/previous-schools.component";
import { AserComponent } from "../../child-dev-project/aser/aser-component/aser.component";
import { GroupedChildAttendanceComponent } from "../../child-dev-project/children/child-details/grouped-child-attendance/grouped-child-attendance.component";
import { NotesOfChildComponent } from "../../child-dev-project/notes/notes-of-child/notes-of-child.component";
import { HealthCheckupComponent } from "../../child-dev-project/health-checkup/health-checkup-component/health-checkup.component";
import { EducationalMaterialComponent } from "../../child-dev-project/educational-material/educational-material-component/educational-material.component";
import { RecentAttendanceBlocksComponent } from "../../child-dev-project/children/children-list/recent-attendance-blocks/recent-attendance-blocks.component";
import { SchoolBlockWrapperComponent } from "../../child-dev-project/children/children-list/school-block-wrapper/school-block-wrapper.component";
import { ChildrenOverviewComponent } from "../../child-dev-project/schools/children-overview/children-overview.component";
import { ChildBlockListComponent } from "../../child-dev-project/children/child-block-list/child-block-list.component";
import { ChildBlockComponent } from "../../child-dev-project/children/child-block/child-block.component";
import { FormComponent } from "../entity-components/entity-details/form/form.component";
import { DisplayTextComponent } from "../entity-components/entity-list/display-text/display-text.component";
import { DisplayCheckmarkComponent } from "../entity-components/entity-list/display-checkmark/display-checkmark.component";
import { DisplayDateComponent } from "../entity-components/entity-list/display-date/display-date.component";
import { DisplayConfigurableEnumComponent } from "../entity-components/entity-list/display-configurable-enum/display-configurable-enum.component";
import { ActivityParticipantsSectionComponent } from "../../child-dev-project/attendance/activity-participants-section/activity-participants-section.component";
import { ActivityAttendanceSectionComponent } from "../../child-dev-project/attendance/activity-attendance-section/activity-attendance-section.component";
import { PreviousTeamsComponent } from "../../child-dev-project/previous-teams/previous-teams.component";
import { BmiBlockComponent } from "../../child-dev-project/children/children-list/bmi-block/bmi-block.component";
import { ChildrenBmiDashboardComponent } from "../../child-dev-project/children/children-bmi-dashboard/children-bmi-dashboard.component";
import { DashboardShortcutWidgetComponent } from "../dashboard-shortcut-widget/dashboard-shortcut-widget/dashboard-shortcut-widget.component";
import { UsersBlockComponent } from "../user/users-block/users-block.component";
import { UserListComponent } from "../admin/user-list/user-list.component";
import { HistoricalDataComponent } from "../../features/historical-data/historical-data/historical-data.component";

export const DYNAMIC_COMPONENTS_MAP = new Map<string, any>([
  ["ChildrenCountDashboard", ChildrenCountDashboardComponent],
  ["RecentNotesDashboard", RecentNotesDashboardComponent],
  ["NoRecentNotesDashboard", NoRecentNotesDashboardComponent],
  ["AttendanceWeekDashboard", AttendanceWeekDashboardComponent],
  ["ProgressDashboard", ProgressDashboardComponent],
  ["PreviousSchools", PreviousSchoolsComponent],
  ["PreviousTeams", PreviousTeamsComponent],
  ["Aser", AserComponent],
  ["GroupedChildAttendance", GroupedChildAttendanceComponent],
  ["ActivityParticipantsSection", ActivityParticipantsSectionComponent],
  ["ActivityAttendanceSection", ActivityAttendanceSectionComponent],
  ["NotesOfChild", NotesOfChildComponent],
  ["HealthCheckup", HealthCheckupComponent],
  ["EducationalMaterial", EducationalMaterialComponent],
  ["Form", FormComponent],
  ["DisplayDate", DisplayDateComponent],
  ["DisplayText", DisplayTextComponent],
  ["DisplayConfigurableEnum", DisplayConfigurableEnumComponent],
  ["DisplayCheckmark", DisplayCheckmarkComponent],
  ["DisplayUsers", UsersBlockComponent],
  ["ChildBlock", ChildBlockComponent],
  ["ChildBlockList", ChildBlockListComponent],
  ["RecentAttendanceBlocks", RecentAttendanceBlocksComponent],
  ["SchoolBlockWrapper", SchoolBlockWrapperComponent],
  ["ChildrenOverview", ChildrenOverviewComponent],
  ["BmiBlock", BmiBlockComponent],
  ["ChildrenBmiDashboardComponent", ChildrenBmiDashboardComponent],
  ["UserList", UserListComponent],
  ["DashboardShortcutWidget", DashboardShortcutWidgetComponent],
  ["HistoricalDataComponent", HistoricalDataComponent],
]);
