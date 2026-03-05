import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { ActivityAttendance } from "../../model/activity-attendance";
import { Entity } from "#src/app/core/entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { PercentPipe } from "@angular/common";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";
import { EntitiesTableComponent } from "#src/app/core/common-components/entities-table/entities-table.component";

/**
 * Displays detailed attendance data for a calculated attendance time period (`ActivityAttendance`).
 * This is often displayed as a dialog for drilling down into details.
 */
@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    MatFormFieldModule,
    PercentPipe,
    CustomDatePipe,
    FormsModule,
    MatInputModule,
    EntitiesTableComponent,
    AttendanceCalendarComponent,
  ],
})
export class AttendanceDetailsComponent {
  private formDialog = inject(FormDialogService);
  private data = inject<{
    forChild: string;
    attendance: ActivityAttendance;
  }>(MAT_DIALOG_DATA);

  entity = input(this.data.attendance);
  forChild = input(this.data.forChild);

  eventEntityType = computed(() =>
    this.entity()?.events[0]?.entity?.getConstructor(),
  );
  eventEntities = computed<Entity[]>(
    () => this.entity()?.events.map((e) => e.entity) ?? [],
  );

  eventsColumns: FormFieldConfig[] = [
    { id: "date" },
    { id: "subject", label: $localize`Event` },
    {
      id: "getAttendance",
      label: $localize`:How a child attended, e.g. too late, in time, excused, e.t.c:Attended`,
      viewComponent: "ReadonlyFunction",
      additional: (event: Entity) => {
        const eventWithAttendance = this.entity().events.find(
          (e) => e.entity === event,
        );
        if (this.forChild()) {
          const item = eventWithAttendance?.getAttendanceForParticipant(
            this.forChild(),
          );
          return item?.status?.label || "-";
        } else {
          const avg = eventWithAttendance?.getAttendanceStats().average;
          if (!Number.isFinite(avg)) {
            return $localize`N/A`;
          }
          return `${(avg * 100).toFixed(0)}%`;
        }
      },
    },
  ];

  showEventDetails(event: Entity) {
    this.formDialog.openView(event);
  }
}
