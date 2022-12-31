import { Routes } from "@angular/router";

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
];
