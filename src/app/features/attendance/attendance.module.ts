import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "#src/app/dynamic-components";
import { attendanceComponents } from "./attendance-components";
import { attendanceRoutes } from "./attendance.routing";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { EventAttendanceMapDatatype } from "./deprecated/event-attendance-map.datatype";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";
import { AttendancePermissionGuard } from "./attendance-permission.guard";
import { AbstractPermissionGuard } from "#src/app/core/permissions/permission-guard/abstract-permission.guard";

@NgModule({
  providers: [
    {
      provide: DefaultDatatype,
      useClass: EventAttendanceMapDatatype,
      multi: true,
    },
    {
      provide: DefaultDatatype,
      useClass: AttendanceDatatype,
      multi: true,
    },
    AttendancePermissionGuard,
    {
      provide: AbstractPermissionGuard,
      useExisting: AttendancePermissionGuard,
      multi: true,
    },
  ],
})
export class AttendanceModule {
  static databaseEntities = [];
  static routes = attendanceRoutes;

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "AttendanceWeekDashboard",
      label: $localize`Attendance (recent absences)`,
      settingsComponent: "AttendanceWeekDashboardSettings",
      defaultConfig: { daysOffset: 7, periodLabel: $localize`this week` },
    });

    const components = inject(ComponentRegistry);

    components.addAll(attendanceComponents);
  }
}
