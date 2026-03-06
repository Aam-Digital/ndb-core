import { inject } from "@angular/core";
import { Routes } from "@angular/router";
import { RoutedViewComponent } from "#src/app/core/ui/routed-view/routed-view.component";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";

export const attendanceRoutes: Routes = [
  {
    path: "",
    component: RoutedViewComponent,
    data: {
      component: "AttendanceManager",
    },
  },
  {
    path: "add-day",
    component: RoutedViewComponent,
    data: {
      component: "AddDayAttendance",
    },
  },
  {
    path: "add-day/:id",
    component: RoutedViewComponent,
    data: {
      component: "RollCall",
    },
    canDeactivate: [() => inject(UnsavedChangesService).checkUnsavedChanges()],
  },
];
