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
import { AttendanceInitService } from "./attendance-init.service";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityAction } from "#src/app/core/entity-details/entity-actions-menu/entity-action.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceExportService } from "./attendance-export.service";

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
    AttendanceInitService,
  ],
})
export class AttendanceModule {
  static databaseEntities = [];
  static routes = attendanceRoutes;

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);
  private readonly attendanceExportService = inject(AttendanceExportService);

  constructor() {
    this.widgetRegistry.register({
      component: "AttendanceWeekDashboard",
      label: $localize`Attendance (recent absences)`,
      settingsComponent: "AttendanceWeekDashboardSettings",
      defaultConfig: { daysOffset: 7, periodLabel: $localize`this week` },
    });

    const components = inject(ComponentRegistry);
    components.addAll(attendanceComponents);

    inject(AttendanceInitService).registerDefaultAttendanceStatusEnum();

    const entityActionsMenu = inject(EntityActionsMenuService);
    entityActionsMenu.registerActionsFactories([
      (entity) => this.getAttendanceExportActions(entity),
    ]);
  }

  private getAttendanceExportActions(entity?: Entity): EntityAction[] {
    if (!entity) {
      return [];
    }

    const fields = this.attendanceExportService.getAttendanceFields(entity);
    return fields.map((field) => ({
      action: `download-attendance-${field.fieldId}`,
      label: $localize`Download ${field.label} list`,
      icon: "download",
      permission: "read" as const,
      availableFor: "individual-only" as const,
      execute: async (e: Entity) => {
        const singleEntity = Array.isArray(e) ? e[0] : e;
        await this.attendanceExportService.exportAttendanceList(
          singleEntity,
          field.fieldId,
          field.label,
        );
        return true;
      },
    }));
  }
}
