import { Component, Input, ViewChild } from "@angular/core";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ActivityAttendance } from "../model/activity-attendance";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { Note } from "../../notes/model/note";
import { calculateAverageAttendance } from "../model/calculate-average-event-attendance";
import { NullAttendanceStatusType } from "../model/attendance-status";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { EventNote } from "../model/event-note";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
})
export class AttendanceDetailsComponent
  implements ShowsEntity<ActivityAttendance>, OnInitDynamicComponent
{
  @Input() entity: ActivityAttendance = new ActivityAttendance();
  @Input() focusedChild: string;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  eventsColumns: FormFieldConfig[] = [
    { id: "date" },
    { id: "subject", label: "Event" },
    {
      id: "getAttendance",
      label: "Attended",
      view: "ReadonlyFunction",
      additional: (note: Note) => {
        if (this.focusedChild) {
          return note.getAttendance(this.focusedChild).status.label;
        } else {
          return (
            Math.round(calculateAverageAttendance(note).average * 10) / 10 ||
            "N/A"
          );
        }
      },
    },
  ];
  UnknownStatus = NullAttendanceStatusType;

  constructor(private formDialog: FormDialogService) {}

  onInitFromDynamicConfig(config?: { forChild?: string }) {
    if (config?.forChild) {
      this.focusedChild = config.forChild;
    }
  }

  showEventDetails(event: EventNote) {
    this.formDialog.openDialog(NoteDetailsComponent, event);
  }
}
