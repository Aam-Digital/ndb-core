import { Component, Inject, Input } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { Note } from "../../notes/model/note";
import { calculateAverageAttendance } from "../model/calculate-average-event-attendance";
import { FormFieldConfig } from "../../../core/common-components/entity-form/entity-form/FormConfig";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { EventNote } from "../model/event-note";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DatePipe, NgIf, PercentPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";
import { EntitySubrecordComponent } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    MatFormFieldModule,
    NgIf,
    PercentPipe,
    DatePipe,
    FormsModule,
    MatInputModule,
    EntitySubrecordComponent,
    AttendanceCalendarComponent,
  ],
  standalone: true,
})
export class AttendanceDetailsComponent {
  @Input() entity: ActivityAttendance = new ActivityAttendance();
  @Input() forChild: string;

  eventsColumns: FormFieldConfig[] = [
    { id: "date" },
    { id: "subject", label: $localize`Event` },
    {
      id: "getAttendance",
      label: $localize`:How a child attended, e.g. too late, in time, excused, e.t.c:Attended`,
      viewComponent: "ReadonlyFunction",
      additional: (note: Note) => {
        if (this.forChild) {
          return note.getAttendance(this.forChild)?.status?.label || "-";
        } else {
          return (
            (calculateAverageAttendance(note).average * 100).toFixed(0) + "%" ||
            "N/A"
          );
        }
      },
    },
  ];

  constructor(
    private formDialog: FormDialogService,
    @Inject(MAT_DIALOG_DATA)
    data: { forChild: string; attendance: ActivityAttendance },
  ) {
    this.entity = data.attendance;
    this.forChild = data.forChild;
  }

  showEventDetails(event: EventNote) {
    this.formDialog.openFormPopup(event, [], NoteDetailsComponent);
  }
}
