import { inject } from "@angular/core";
import { Routes } from "@angular/router";
import { RoutedViewComponent } from "#src/app/core/ui/routed-view/routed-view.component";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { AttendancePermissionGuard } from "./attendance-permission.guard";

export const attendanceRoutes: Routes = [
  {
    path: "",
    component: RoutedViewComponent,
    data: {
      component: "AttendanceManager",
    },
    canActivate: [AttendancePermissionGuard],
  },
  {
    path: "add-day",
    component: RoutedViewComponent,
    data: {
      component: "AddDayAttendance",
    },
    canActivate: [AttendancePermissionGuard],
  },
  {
    path: "add-day/:id",
    component: RoutedViewComponent,
    data: {
      component: "RollCall",
    },
    canActivate: [AttendancePermissionGuard],
    canDeactivate: [() => inject(UnsavedChangesService).checkUnsavedChanges()],
  },
];
