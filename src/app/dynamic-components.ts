import { Type } from "@angular/core";

// TODO make a build script that looks for annotations and creates this
export const dynamicComponents = new Map<string, () => Promise<Type<any>>>([
  [
    "Dashboard",
    () =>
      import("./core/dashboard/dashboard/dashboard.component").then(
        (c) => c.DashboardComponent
      ),
  ],
  [
    "EntityList",
    () =>
      import("./core/entity-components/entity-list/entity-list.component").then(
        (c) => c.EntityListComponent
      ),
  ],
  [
    "ChildrenList",
    () =>
      import(
        "./child-dev-project/children/children-list/children-list.component"
      ).then((c) => c.ChildrenListComponent),
  ],
  [
    "NotesManager",
    () =>
      import(
        "./child-dev-project/notes/notes-manager/notes-manager.component"
      ).then((c) => c.NotesManagerComponent),
  ],
  [
    "EntityDetails",
    () =>
      import(
        "./core/entity-components/entity-details/entity-details.component"
      ).then((c) => c.EntityDetailsComponent),
  ],
  [
    "AttendanceManager",
    () =>
      import(
        "./child-dev-project/attendance/attendance-manager/attendance-manager.component"
      ).then((c) => c.AttendanceManagerComponent),
  ],
  [
    "Reporting",
    () =>
      import("./features/reporting/reporting/reporting.component").then(
        (c) => c.ReportingComponent
      ),
  ],
  [
    "AddDayAttendance",
    () =>
      import(
        "./child-dev-project/attendance/add-day-attendance/add-day-attendance.component"
      ).then((c) => c.AddDayAttendanceComponent),
  ],
  [
    "Admin",
    () =>
      import("./core/admin/admin/admin.component").then(
        (c) => c.AdminComponent
      ),
  ],
  [
    "ConfigImport",
    () =>
      import("./core/config-setup/config-import/config-import.component").then(
        (c) => c.ConfigImportComponent
      ),
  ],
  [
    "MarkdownPage",
    () =>
      import("./core/markdown-page/markdown-page/markdown-page.component").then(
        (c) => c.MarkdownPageComponent
      ),
  ],
  [
    "Import",
    () =>
      import("./features/data-import/data-import/data-import.component").then(
        (c) => c.DataImportComponent
      ),
  ],
  [
    "MatchingEntities",
    () =>
      import(
        "./features/matching-entities/matching-entities/matching-entities.component"
      ).then((c) => c.MatchingEntitiesComponent),
  ],
  [
    "ActivityAttendanceSection",
    () =>
      import(
        "./child-dev-project/attendance/activity-attendance-section/activity-attendance-section.component"
      ).then((c) => c.ActivityAttendanceSectionComponent),
  ],
  [
    "AttendanceWeekDashboard",
    () =>
      import(
        "./child-dev-project/attendance/dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component"
      ).then((c) => c.AttendanceWeekDashboardComponent),
  ],
  [
    "GroupedChildAttendance",
    () =>
      import(
        "./child-dev-project/children/child-details/grouped-child-attendance/grouped-child-attendance.component"
      ).then((c) => c.GroupedChildAttendanceComponent),
  ],
  [
    "RecentAttendanceBlocks",
    () =>
      import(
        "./child-dev-project/children/children-list/recent-attendance-blocks/recent-attendance-blocks.component"
      ).then((c) => c.RecentAttendanceBlocksComponent),
  ],
  [
    "Aser",
    () =>
      import(
        "./child-dev-project/children/aser/aser-component/aser.component"
      ).then((c) => c.AserComponent),
  ],
  [
    "ChildBlock",
    () =>
      import(
        "./child-dev-project/children/child-block/child-block.component"
      ).then((c) => c.ChildBlockComponent),
  ],
  [
    "EntityCountDashboard",
    () =>
      import(
        "./child-dev-project/children/dashboard-widgets/entity-count-dashboard/entity-count-dashboard.component"
      ).then((c) => c.EntityCountDashboardComponent),
  ],
  [
    "ChildrenCountDashboard",
    () =>
      import(
        "./child-dev-project/children/dashboard-widgets/entity-count-dashboard/entity-count-dashboard.component"
      ).then((c) => c.EntityCountDashboardComponent),
  ],
  [
    "ChildrenBmiDashboard",
    () =>
      import(
        "./child-dev-project/children/dashboard-widgets/children-bmi-dashboard/children-bmi-dashboard.component"
      ).then((c) => c.ChildrenBmiDashboardComponent),
  ],
  [
    "EducationalMaterial",
    () =>
      import(
        "./child-dev-project/children/educational-material/educational-material-component/educational-material.component"
      ).then((c) => c.EducationalMaterialComponent),
  ],
  [
    "BmiBlock",
    () =>
      import(
        "./child-dev-project/children/children-list/bmi-block/bmi-block.component"
      ).then((c) => c.BmiBlockComponent),
  ],
  [
    "HealthCheckup",
    () =>
      import(
        "./child-dev-project/children/health-checkup/health-checkup-component/health-checkup.component"
      ).then((c) => c.HealthCheckupComponent),
  ],
  [
    "BirthdayDashboard",
    () =>
      import(
        "./child-dev-project/children/dashboard-widgets/birthday-dashboard/birthday-dashboard.component"
      ).then((c) => c.BirthdayDashboardComponent),
  ],
  [
    "NoteAttendanceCountBlock",
    () =>
      import(
        "./child-dev-project/notes/note-attendance-block/note-attendance-count-block.component"
      ).then((c) => c.NoteAttendanceCountBlockComponent),
  ],
  [
    "NotesDashboard",
    () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/notes-dashboard/notes-dashboard.component"
      ).then((c) => c.NotesDashboardComponent),
  ],
  [
    "DisplayEntity",
    () =>
      import(
        "./core/entity-components/entity-select/display-entity/display-entity.component"
      ).then((c) => c.DisplayEntityComponent),
  ],
  [
    "NotesRelatedToEntity",
    () =>
      import(
        "./child-dev-project/notes/notes-related-to-entity/notes-related-to-entity.component"
      ).then((c) => c.NotesRelatedToEntityComponent),
  ],
  [
    "NotesOfChild",
    () =>
      import(
        "./child-dev-project/notes/notes-related-to-entity/notes-related-to-entity.component"
      ).then((c) => c.NotesRelatedToEntityComponent),
  ],
  [
    "ImportantNotesDashboard",
    () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component"
      ).then((c) => c.ImportantNotesDashboardComponent),
  ],
  [
    "ImportantNotesComponent",
    () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component"
      ).then((c) => c.ImportantNotesDashboardComponent),
  ],
  [
    "PreviousSchools",
    () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  ],
  [
    "ChildrenOverview",
    () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  ],
  [
    "ChildSchoolOverview",
    () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  ],
  [
    "SchoolBlock",
    () =>
      import(
        "./child-dev-project/schools/school-block/school-block.component"
      ).then((c) => c.SchoolBlockComponent),
  ],
  [
    "ActivitiesOverview",
    () =>
      import(
        "./child-dev-project/schools/activities-overview/activities-overview.component"
      ).then((c) => c.ActivitiesOverviewComponent),
  ],
  [
    "ConflictResolution",
    () =>
      import(
        "./conflict-resolution/conflict-resolution-list/conflict-resolution-list.component"
      ).then((c) => c.ConflictResolutionListComponent),
  ],
  [
    "DisplayConfigurableEnum",
    () =>
      import(
        "./core/configurable-enum/display-configurable-enum/display-configurable-enum.component"
      ).then((c) => c.DisplayConfigurableEnumComponent),
  ],
  [
    "EditConfigurableEnum",
    () =>
      import(
        "./core/configurable-enum/edit-configurable-enum/edit-configurable-enum.component"
      ).then((c) => c.EditConfigurableEnumComponent),
  ],
  [
    "DashboardShortcutWidget",
    () =>
      import(
        "./core/dashboard-shortcut-widget/dashboard-shortcut-widget/dashboard-shortcut-widget.component"
      ).then((c) => c.DashboardShortcutWidgetComponent),
  ],
  [
    "Form",
    () =>
      import(
        "./core/entity-components/entity-details/form/form.component"
      ).then((c) => c.FormComponent),
  ],
  [
    "EditEntityArray",
    () =>
      import(
        "./core/entity-components/entity-select/edit-entity-array/edit-entity-array.component"
      ).then((c) => c.EditEntityArrayComponent),
  ],
  [
    "EditSingleEntity",
    () =>
      import(
        "./core/entity-components/entity-select/edit-single-entity/edit-single-entity.component"
      ).then((c) => c.EditSingleEntityComponent),
  ],
  [
    "DisplayEntityArray",
    () =>
      import(
        "./core/entity-components/entity-select/display-entity-array/display-entity-array.component"
      ).then((c) => c.DisplayEntityArrayComponent),
  ],
  [
    "EditTextWithAutocomplete",
    () =>
      import(
        "./core/entity-components/entity-select/edit-text-with-autocomplete/edit-text-with-autocomplete.component"
      ).then((c) => c.EditTextWithAutocompleteComponent),
  ],
  [
    "EditAge",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-age/edit-age.component"
      ).then((c) => c.EditAgeComponent),
  ],
  [
    "EditText",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-text/edit-text.component"
      ).then((c) => c.EditTextComponent),
  ],
  [
    "EditBoolean",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-boolean/edit-boolean.component"
      ).then((c) => c.EditBooleanComponent),
  ],
  [
    "EditDate",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-date/edit-date.component"
      ).then((c) => c.EditDateComponent),
  ],
  [
    "EditLongText",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-long-text/edit-long-text.component"
      ).then((c) => c.EditLongTextComponent),
  ],
  [
    "EditPhoto",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-photo/edit-photo.component"
      ).then((c) => c.EditPhotoComponent),
  ],
  [
    "EditNumber",
    () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-number/edit-number.component"
      ).then((c) => c.EditNumberComponent),
  ],
  [
    "DisplayCheckmark",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-checkmark/display-checkmark.component"
      ).then((c) => c.DisplayCheckmarkComponent),
  ],
  [
    "DisplayText",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-text/display-text.component"
      ).then((c) => c.DisplayTextComponent),
  ],
  [
    "DisplayDate",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-date/display-date.component"
      ).then((c) => c.DisplayDateComponent),
  ],
  [
    "ReadonlyFunction",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/readonly-function/readonly-function.component"
      ).then((c) => c.ReadonlyFunctionComponent),
  ],
  [
    "DisplayPercentage",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-percentage/display-percentage.component"
      ).then((c) => c.DisplayPercentageComponent),
  ],
  [
    "DisplayUnit",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-unit/display-unit.component"
      ).then((c) => c.DisplayUnitComponent),
  ],
  [
    "DisplayAge",
    () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-age/display-age.component"
      ).then((c) => c.DisplayAgeComponent),
  ],
  [
    "UserSecurity",
    () =>
      import("./core/user/user-security/user-security.component").then(
        (c) => c.UserSecurityComponent
      ),
  ],
  [
    "EditFile",
    () =>
      import("./features/file/edit-file/edit-file.component").then(
        (c) => c.EditFileComponent
      ),
  ],
  [
    "ViewFile",
    () =>
      import("./features/file/view-file/view-file.component").then(
        (c) => c.ViewFileComponent
      ),
  ],
  [
    "HistoricalDataComponent",
    () =>
      import(
        "./features/historical-data/historical-data/historical-data.component"
      ).then((c) => c.HistoricalDataComponent),
  ],
  [
    "EditLocation",
    () =>
      import("./features/location/edit-location/edit-location.component").then(
        (c) => c.EditLocationComponent
      ),
  ],
  [
    "ViewLocation",
    () =>
      import("./features/location/view-location/view-location.component").then(
        (c) => c.ViewLocationComponent
      ),
  ],
  [
    "DisplayDistance",
    () =>
      import("./features/location/view-distance/view-distance.component").then(
        (c) => c.ViewDistanceComponent
      ),
  ],
  [
    "ProgressDashboard",
    () =>
      import(
        "./features/progress-dashboard-widget/progress-dashboard/progress-dashboard.component"
      ).then((c) => c.ProgressDashboardComponent),
  ],
]);
