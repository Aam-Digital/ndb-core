import { Routes } from "@angular/router";

// TODO make a build script that looks for annotations and creates this
export const componentRoutes: Routes = [
  {
    path: "dynamic/Dashboard",
    loadComponent: () =>
      import("./core/dashboard/dashboard/dashboard.component").then(
        (c) => c.DashboardComponent
      ),
  },
  {
    path: "dynamic/EntityList",
    loadComponent: () =>
      import("./core/entity-components/entity-list/entity-list.component").then(
        (c) => c.EntityListComponent
      ),
  },
  {
    path: "dynamic/ChildrenList",
    loadComponent: () =>
      import(
        "./child-dev-project/children/children-list/children-list.component"
      ).then((c) => c.ChildrenListComponent),
  },
  {
    path: "dynamic/NotesManager",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/notes-manager/notes-manager.component"
      ).then((c) => c.NotesManagerComponent),
  },
  {
    path: "dynamic/EntityDetails",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-details/entity-details.component"
      ).then((c) => c.EntityDetailsComponent),
  },
  {
    path: "dynamic/AttendanceManager",
    loadComponent: () =>
      import(
        "./child-dev-project/attendance/attendance-manager/attendance-manager.component"
      ).then((c) => c.AttendanceManagerComponent),
  },
  {
    path: "dynamic/Reporting",
    loadComponent: () =>
      import("./features/reporting/reporting/reporting.component").then(
        (c) => c.ReportingComponent
      ),
  },
  {
    path: "dynamic/AddDayAttendance",
    loadComponent: () =>
      import(
        "./child-dev-project/attendance/add-day-attendance/add-day-attendance.component"
      ).then((c) => c.AddDayAttendanceComponent),
  },
  {
    path: "dynamic/Admin",
    loadComponent: () =>
      import("./core/admin/admin/admin.component").then(
        (c) => c.AdminComponent
      ),
  },
  {
    path: "dynamic/ConfigImport",
    loadComponent: () =>
      import("./core/config-setup/config-import/config-import.component").then(
        (c) => c.ConfigImportComponent
      ),
  },
  {
    path: "dynamic/MarkdownPage",
    loadComponent: () =>
      import("./core/markdown-page/markdown-page/markdown-page.component").then(
        (c) => c.MarkdownPageComponent
      ),
  },
  {
    path: "dynamic/Import",
    loadComponent: () =>
      import("./features/data-import/data-import/data-import.component").then(
        (c) => c.DataImportComponent
      ),
  },
  {
    path: "dynamic/MatchingEntities",
    loadComponent: () =>
      import(
        "./features/matching-entities/matching-entities/matching-entities.component"
      ).then((c) => c.MatchingEntitiesComponent),
  },
  {
    path: "dynamic/ActivityAttendanceSection",
    loadComponent: () =>
      import(
        "./child-dev-project/attendance/activity-attendance-section/activity-attendance-section.component"
      ).then((c) => c.ActivityAttendanceSectionComponent),
  },
  {
    path: "dynamic/AttendanceWeekDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/attendance/dashboard-widgets/attendance-week-dashboard/attendance-week-dashboard.component"
      ).then((c) => c.AttendanceWeekDashboardComponent),
  },
  {
    path: "dynamic/GroupedChildAttendance",
    loadComponent: () =>
      import(
        "./child-dev-project/children/child-details/grouped-child-attendance/grouped-child-attendance.component"
      ).then((c) => c.GroupedChildAttendanceComponent),
  },
  {
    path: "dynamic/RecentAttendanceBlocks",
    loadComponent: () =>
      import(
        "./child-dev-project/children/children-list/recent-attendance-blocks/recent-attendance-blocks.component"
      ).then((c) => c.RecentAttendanceBlocksComponent),
  },
  {
    path: "dynamic/Aser",
    loadComponent: () =>
      import(
        "./child-dev-project/children/aser/aser-component/aser.component"
      ).then((c) => c.AserComponent),
  },
  {
    path: "dynamic/ChildBlock",
    loadComponent: () =>
      import(
        "./child-dev-project/children/child-block/child-block.component"
      ).then((c) => c.ChildBlockComponent),
  },
  {
    path: "dynamic/EntityCountDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/children/dashboard-widgets/entity-count-dashboard/entity-count-dashboard.component"
      ).then((c) => c.EntityCountDashboardComponent),
  },
  {
    path: "dynamic/ChildrenCountDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/children/dashboard-widgets/entity-count-dashboard/entity-count-dashboard.component"
      ).then((c) => c.EntityCountDashboardComponent),
  },
  {
    path: "dynamic/ChildrenBmiDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/children/dashboard-widgets/children-bmi-dashboard/children-bmi-dashboard.component"
      ).then((c) => c.ChildrenBmiDashboardComponent),
  },
  {
    path: "dynamic/EducationalMaterial",
    loadComponent: () =>
      import(
        "./child-dev-project/children/educational-material/educational-material-component/educational-material.component"
      ).then((c) => c.EducationalMaterialComponent),
  },
  {
    path: "dynamic/BmiBlock",
    loadComponent: () =>
      import(
        "./child-dev-project/children/children-list/bmi-block/bmi-block.component"
      ).then((c) => c.BmiBlockComponent),
  },
  {
    path: "dynamic/HealthCheckup",
    loadComponent: () =>
      import(
        "./child-dev-project/children/health-checkup/health-checkup-component/health-checkup.component"
      ).then((c) => c.HealthCheckupComponent),
  },
  {
    path: "dynamic/BirthdayDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/children/dashboard-widgets/birthday-dashboard/birthday-dashboard.component"
      ).then((c) => c.BirthdayDashboardComponent),
  },
  {
    path: "dynamic/NoteAttendanceCountBlock",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/note-attendance-block/note-attendance-count-block.component"
      ).then((c) => c.NoteAttendanceCountBlockComponent),
  },
  {
    path: "dynamic/NotesDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/notes-dashboard/notes-dashboard.component"
      ).then((c) => c.NotesDashboardComponent),
  },
  {
    path: "dynamic/DisplayEntity",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-select/display-entity/display-entity.component"
      ).then((c) => c.DisplayEntityComponent),
  },
  {
    path: "dynamic/NotesRelatedToEntity",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/notes-related-to-entity/notes-related-to-entity.component"
      ).then((c) => c.NotesRelatedToEntityComponent),
  },
  {
    path: "dynamic/NotesOfChild",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/notes-related-to-entity/notes-related-to-entity.component"
      ).then((c) => c.NotesRelatedToEntityComponent),
  },
  {
    path: "dynamic/ImportantNotesDashboard",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component"
      ).then((c) => c.ImportantNotesDashboardComponent),
  },
  {
    path: "dynamic/ImportantNotesComponent",
    loadComponent: () =>
      import(
        "./child-dev-project/notes/dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component"
      ).then((c) => c.ImportantNotesDashboardComponent),
  },
  {
    path: "dynamic/PreviousSchools",
    loadComponent: () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  },
  {
    path: "dynamic/ChildrenOverview",
    loadComponent: () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  },
  {
    path: "dynamic/ChildSchoolOverview",
    loadComponent: () =>
      import(
        "./child-dev-project/schools/child-school-overview/child-school-overview.component"
      ).then((c) => c.ChildSchoolOverviewComponent),
  },
  {
    path: "dynamic/SchoolBlock",
    loadComponent: () =>
      import(
        "./child-dev-project/schools/school-block/school-block.component"
      ).then((c) => c.SchoolBlockComponent),
  },
  {
    path: "dynamic/ActivitiesOverview",
    loadComponent: () =>
      import(
        "./child-dev-project/schools/activities-overview/activities-overview.component"
      ).then((c) => c.ActivitiesOverviewComponent),
  },
  {
    path: "dynamic/ConflictResolution",
    loadComponent: () =>
      import(
        "./conflict-resolution/conflict-resolution-list/conflict-resolution-list.component"
      ).then((c) => c.ConflictResolutionListComponent),
  },
  {
    path: "dynamic/DisplayConfigurableEnum",
    loadComponent: () =>
      import(
        "./core/configurable-enum/display-configurable-enum/display-configurable-enum.component"
      ).then((c) => c.DisplayConfigurableEnumComponent),
  },
  {
    path: "dynamic/EditConfigurableEnum",
    loadComponent: () =>
      import(
        "./core/configurable-enum/edit-configurable-enum/edit-configurable-enum.component"
      ).then((c) => c.EditConfigurableEnumComponent),
  },
  {
    path: "dynamic/DashboardShortcutWidget",
    loadComponent: () =>
      import(
        "./core/dashboard-shortcut-widget/dashboard-shortcut-widget/dashboard-shortcut-widget.component"
      ).then((c) => c.DashboardShortcutWidgetComponent),
  },
  {
    path: "dynamic/Form",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-details/form/form.component"
      ).then((c) => c.FormComponent),
  },
  {
    path: "dynamic/EditEntityArray",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-select/edit-entity-array/edit-entity-array.component"
      ).then((c) => c.EditEntityArrayComponent),
  },
  {
    path: "dynamic/EditSingleEntity",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-select/edit-single-entity/edit-single-entity.component"
      ).then((c) => c.EditSingleEntityComponent),
  },
  {
    path: "dynamic/DisplayEntityArray",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-select/display-entity-array/display-entity-array.component"
      ).then((c) => c.DisplayEntityArrayComponent),
  },
  {
    path: "dynamic/EditTextWithAutocomplete",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-select/edit-text-with-autocomplete/edit-text-with-autocomplete.component"
      ).then((c) => c.EditTextWithAutocompleteComponent),
  },
  {
    path: "dynamic/EditAge",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-age/edit-age.component"
      ).then((c) => c.EditAgeComponent),
  },
  {
    path: "dynamic/EditText",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-text/edit-text.component"
      ).then((c) => c.EditTextComponent),
  },
  {
    path: "dynamic/EditBoolean",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-boolean/edit-boolean.component"
      ).then((c) => c.EditBooleanComponent),
  },
  {
    path: "dynamic/EditDate",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-date/edit-date.component"
      ).then((c) => c.EditDateComponent),
  },
  {
    path: "dynamic/EditLongText",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-long-text/edit-long-text.component"
      ).then((c) => c.EditLongTextComponent),
  },
  {
    path: "dynamic/EditPhoto",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-photo/edit-photo.component"
      ).then((c) => c.EditPhotoComponent),
  },
  {
    path: "dynamic/EditNumber",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/dynamic-form-components/edit-number/edit-number.component"
      ).then((c) => c.EditNumberComponent),
  },
  {
    path: "dynamic/DisplayCheckmark",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-checkmark/display-checkmark.component"
      ).then((c) => c.DisplayCheckmarkComponent),
  },
  {
    path: "dynamic/DisplayText",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-text/display-text.component"
      ).then((c) => c.DisplayTextComponent),
  },
  {
    path: "dynamic/DisplayDate",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-date/display-date.component"
      ).then((c) => c.DisplayDateComponent),
  },
  {
    path: "dynamic/ReadonlyFunction",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/readonly-function/readonly-function.component"
      ).then((c) => c.ReadonlyFunctionComponent),
  },
  {
    path: "dynamic/DisplayPercentage",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-percentage/display-percentage.component"
      ).then((c) => c.DisplayPercentageComponent),
  },
  {
    path: "dynamic/DisplayUnit",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-unit/display-unit.component"
      ).then((c) => c.DisplayUnitComponent),
  },
  {
    path: "dynamic/DisplayAge",
    loadComponent: () =>
      import(
        "./core/entity-components/entity-utils/view-components/display-age/display-age.component"
      ).then((c) => c.DisplayAgeComponent),
  },
  {
    path: "dynamic/UserSecurity",
    loadComponent: () =>
      import("./core/user/user-security/user-security.component").then(
        (c) => c.UserSecurityComponent
      ),
  },
  {
    path: "dynamic/EditFile",
    loadComponent: () =>
      import("./features/file/edit-file/edit-file.component").then(
        (c) => c.EditFileComponent
      ),
  },
  {
    path: "dynamic/ViewFile",
    loadComponent: () =>
      import("./features/file/view-file/view-file.component").then(
        (c) => c.ViewFileComponent
      ),
  },
  {
    path: "dynamic/HistoricalDataComponent",
    loadComponent: () =>
      import(
        "./features/historical-data/historical-data/historical-data.component"
      ).then((c) => c.HistoricalDataComponent),
  },
  {
    path: "dynamic/EditLocation",
    loadComponent: () =>
      import("./features/location/edit-location/edit-location.component").then(
        (c) => c.EditLocationComponent
      ),
  },
  {
    path: "dynamic/ViewLocation",
    loadComponent: () =>
      import("./features/location/view-location/view-location.component").then(
        (c) => c.ViewLocationComponent
      ),
  },
  {
    path: "dynamic/DisplayDistance",
    loadComponent: () =>
      import("./features/location/view-distance/view-distance.component").then(
        (c) => c.ViewDistanceComponent
      ),
  },
  {
    path: "dynamic/ProgressDashboard",
    loadComponent: () =>
      import(
        "./features/progress-dashboard-widget/progress-dashboard/progress-dashboard.component"
      ).then((c) => c.ProgressDashboardComponent),
  },
];
