import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "#src/app/dynamic-components";
import { attendanceComponents } from "./attendance-components";
import { RecurringActivity } from "./model/recurring-activity";
import { EventNote } from "./model/event-note";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";

@NgModule({
  providers: [
    {
      provide: DefaultDatatype,
      useClass: AttendanceDatatype,
      multi: true,
    },
  ],
})
export class AttendanceModule {
  static databaseEntities = [RecurringActivity, EventNote];

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
