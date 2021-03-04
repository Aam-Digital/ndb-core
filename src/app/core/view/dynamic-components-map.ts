import { AttendanceAverageDashboardComponent } from "../../child-dev-project/attendance/dashboard-widgets/attendance-average-dashboard/attendance-average-dashboard.component";
import { AttendanceWarningsDashboardComponent } from "../../child-dev-project/attendance/dashboard-widgets/attendance-warnings-dashboard/attendance-warnings-dashboard.component";
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
import { BmiBlockComponent } from "../../child-dev-project/children/children-list/bmi-block/bmi-block.component";
import { DisplayTextArrayComponent } from "../entity-components/entity-list/display-text-array/display-text-array.component";

export const DYNAMIC_COMPONENTS_MAP = new Map<string, any>([
  ["ChildrenCountDashboard", ChildrenCountDashboardComponent],
  ["RecentNotesDashboard", RecentNotesDashboardComponent],
  ["NoRecentNotesDashboard", NoRecentNotesDashboardComponent],
  ["AttendanceWeekDashboard", AttendanceWeekDashboardComponent],
  ["ProgressDashboard", ProgressDashboardComponent],
  ["AttendanceAverageDashboard", AttendanceAverageDashboardComponent],
  ["AttendanceWarningsDashboard", AttendanceWarningsDashboardComponent],
  ["PreviousSchools", PreviousSchoolsComponent],
  ["Aser", AserComponent],
  ["GroupedChildAttendance", GroupedChildAttendanceComponent],
  ["NotesOfChild", NotesOfChildComponent],
  ["HealthCheckup", HealthCheckupComponent],
  ["EducationalMaterial", EducationalMaterialComponent],
  ["Form", FormComponent],
  ["DisplayDate", DisplayDateComponent],
  ["DisplayText", DisplayTextComponent],
  ["DisplayTextArray", DisplayTextArrayComponent],
  ["DisplayConfigurableEnum", DisplayConfigurableEnumComponent],
  ["DisplayCheckmark", DisplayCheckmarkComponent],
  ["ChildBlock", ChildBlockComponent],
  ["ChildBlockList", ChildBlockListComponent],
  ["RecentAttendanceBlocks", RecentAttendanceBlocksComponent],
  ["SchoolBlockWrapper", SchoolBlockWrapperComponent],
  ["ChildrenOverview", ChildrenOverviewComponent],
  ["BmiBlock", BmiBlockComponent],
]);
