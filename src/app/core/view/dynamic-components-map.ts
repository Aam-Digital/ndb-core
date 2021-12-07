import { AttendanceWeekDashboardComponent } from "../../child-dev-project/attendance/dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component";
import { ChildrenCountDashboardComponent } from "../../child-dev-project/children/children-count-dashboard/children-count-dashboard.component";
import { NotesDashboardComponent } from "../../child-dev-project/notes/dashboard-widgets/notes-dashboard/notes-dashboard.component";
import { ProgressDashboardComponent } from "../../child-dev-project/progress-dashboard-widget/progress-dashboard/progress-dashboard.component";
import { PreviousSchoolsComponent } from "../../child-dev-project/previous-schools/previous-schools.component";
import { AserComponent } from "../../child-dev-project/aser/aser-component/aser.component";
import { GroupedChildAttendanceComponent } from "../../child-dev-project/children/child-details/grouped-child-attendance/grouped-child-attendance.component";
import { NotesOfChildComponent } from "../../child-dev-project/notes/notes-of-child/notes-of-child.component";
import { HealthCheckupComponent } from "../../child-dev-project/health-checkup/health-checkup-component/health-checkup.component";
import { EducationalMaterialComponent } from "../../child-dev-project/educational-material/educational-material-component/educational-material.component";
import { RecentAttendanceBlocksComponent } from "../../child-dev-project/children/children-list/recent-attendance-blocks/recent-attendance-blocks.component";
import { ChildrenOverviewComponent } from "../../child-dev-project/schools/children-overview/children-overview.component";
import { ChildBlockComponent } from "../../child-dev-project/children/child-block/child-block.component";
import { DisplayTextComponent } from "../entity-components/entity-utils/view-components/display-text/display-text.component";
import { DisplayCheckmarkComponent } from "../entity-components/entity-utils/view-components/display-checkmark/display-checkmark.component";
import { DisplayDateComponent } from "../entity-components/entity-utils/view-components/display-date/display-date.component";
import { DisplayConfigurableEnumComponent } from "../configurable-enum/display-configurable-enum/display-configurable-enum.component";
import { ActivityAttendanceSectionComponent } from "../../child-dev-project/attendance/activity-attendance-section/activity-attendance-section.component";
import { BmiBlockComponent } from "../../child-dev-project/children/children-list/bmi-block/bmi-block.component";
import { ChildrenBmiDashboardComponent } from "../../child-dev-project/children/children-bmi-dashboard/children-bmi-dashboard.component";
import { DashboardShortcutWidgetComponent } from "../dashboard-shortcut-widget/dashboard-shortcut-widget/dashboard-shortcut-widget.component";
import { UserListComponent } from "../admin/user-list/user-list.component";
import { HistoricalDataComponent } from "../../features/historical-data/historical-data/historical-data.component";
import { EditTextComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-text/edit-text.component";
import { EditConfigurableEnumComponent } from "../configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import { EditDateComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-date/edit-date.component";
import { EditAgeComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-photo/edit-photo.component";
import { ReadonlyFunctionComponent } from "../entity-components/entity-utils/view-components/readonly-function/readonly-function.component";
import { EditEntityArrayComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-entity-array/edit-entity-array.component";
import { SchoolBlockComponent } from "../../child-dev-project/schools/school-block/school-block.component";
import { DisplayEntityComponent } from "../entity-components/entity-utils/view-components/display-entity/display-entity.component";
import { EditSingleEntityComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-single-entity/edit-single-entity.component";
import { DisplayEntityArrayComponent } from "../entity-components/entity-utils/view-components/display-entity-array/display-entity-array.component";
import { EditPercentageComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-percentage/edit-percentage.component";
import { DisplayPercentageComponent } from "../entity-components/entity-utils/view-components/display-percentage/display-percentage.component";
import { DisplayUnitComponent } from "../entity-components/entity-utils/view-components/display-unit/display-unit.component";
import { FormComponent } from "../entity-components/entity-details/form/form.component";
import { EditNumberComponent } from "../entity-components/entity-utils/dynamic-form-components/edit-number/edit-number.component";
import { NoteAttendanceCountBlockComponent } from "../../child-dev-project/notes/note-attendance-block/note-attendance-count-block.component";

export const DYNAMIC_COMPONENTS_MAP = new Map<string, any>([
  ["ChildrenCountDashboard", ChildrenCountDashboardComponent],
  ["NotesDashboard", NotesDashboardComponent],
  ["AttendanceWeekDashboard", AttendanceWeekDashboardComponent],
  ["ProgressDashboard", ProgressDashboardComponent],
  ["PreviousSchools", PreviousSchoolsComponent],
  ["Aser", AserComponent],
  ["GroupedChildAttendance", GroupedChildAttendanceComponent],
  ["ActivityAttendanceSection", ActivityAttendanceSectionComponent],
  ["NotesOfChild", NotesOfChildComponent],
  ["HealthCheckup", HealthCheckupComponent],
  ["EducationalMaterial", EducationalMaterialComponent],
  ["Form", FormComponent],
  ["DisplayDate", DisplayDateComponent],
  ["DisplayText", DisplayTextComponent],
  ["DisplayConfigurableEnum", DisplayConfigurableEnumComponent],
  ["DisplayCheckmark", DisplayCheckmarkComponent],
  ["ChildBlock", ChildBlockComponent],
  ["SchoolBlock", SchoolBlockComponent],
  ["RecentAttendanceBlocks", RecentAttendanceBlocksComponent],
  ["ChildrenOverview", ChildrenOverviewComponent],
  ["BmiBlock", BmiBlockComponent],
  ["ChildrenBmiDashboardComponent", ChildrenBmiDashboardComponent],
  ["UserList", UserListComponent],
  ["DashboardShortcutWidget", DashboardShortcutWidgetComponent],
  ["HistoricalDataComponent", HistoricalDataComponent],
  ["EditText", EditTextComponent],
  ["EditConfigurableEnum", EditConfigurableEnumComponent],
  ["EditDate", EditDateComponent],
  ["EditEntityArray", EditEntityArrayComponent],
  ["EditAge", EditAgeComponent],
  ["EditBoolean", EditBooleanComponent],
  ["EditLongText", EditLongTextComponent],
  ["EditPhoto", EditPhotoComponent],
  ["ReadonlyFunction", ReadonlyFunctionComponent],
  ["DisplayEntity", DisplayEntityComponent],
  ["EditSingleEntity", EditSingleEntityComponent],
  ["DisplayEntityArray", DisplayEntityArrayComponent],
  ["EditPercentage", EditPercentageComponent],
  ["DisplayPercentage", DisplayPercentageComponent],
  ["DisplayUnit", DisplayUnitComponent],
  ["EditNumber", EditNumberComponent],
  ["NoteAttendanceCountBlock", NoteAttendanceCountBlockComponent],
]);
