import { Component, Input, ViewChild } from "@angular/core";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ActivityAttendance } from "../model/activity-attendance";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { Note } from "../../notes/model/note";
import { calculateAverageAttendance } from "../model/calculate-average-event-attendance";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { EventNote } from "../model/event-note";
import { FormDialogWrapperComponent } from "../../../core/form-dialog/form-dialog-wrapper/form-dialog-wrapper.component";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DatePipe, NgIf, PercentPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
  imports: [
    FormDialogWrapperComponent,
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
export class AttendanceDetailsComponent
  implements ShowsEntity<ActivityAttendance>
{
  @Input() entity: ActivityAttendance = new ActivityAttendance();
  @Input() forChild: string;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  eventsColumns: FormFieldConfig[] = [
    { id: "date" },
    { id: "subject", label: $localize`Event` },
    {
      id: "getAttendance",
      label: $localize`:How a child attended, e.g. too late, in time, excused, e.t.c:Attended`,
      view: "ReadonlyFunction",
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

  constructor(private formDialog: FormDialogService) {}

  showEventDetails(event: EventNote) {
    this.formDialog.openSimpleForm(event, [], NoteDetailsComponent);
  }
}
