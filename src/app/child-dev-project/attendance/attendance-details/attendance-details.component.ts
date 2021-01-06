import { Component, Input, ViewChild } from "@angular/core";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ActivityAttendance } from "../model/activity-attendance";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { Note } from "../../notes/model/note";
import { calculateAverageAttendance } from "../model/calculate-average-event-attendance";
import { AttendanceStatus } from "../model/attendance-status";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
})
export class AttendanceDetailsComponent implements ShowsEntity {
  @Input() entity: ActivityAttendance = new ActivityAttendance();
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  eventDetailsComponent = NoteDetailsComponent;
  eventsColumns: Array<ColumnDescription> = [
    {
      name: "date",
      label: "Date",
      inputType: ColumnDescriptionInputType.DATE,
    },
    {
      name: "subject",
      label: "Event",
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      name: "getAttendance",
      label: "Attended",
      inputType: ColumnDescriptionInputType.FUNCTION,
      valueFunction: (note: Note) => {
        if (this.entity.focusedChild) {
          return note.getAttendance(this.entity.focusedChild).status;
        } else {
          return calculateAverageAttendance(note).average;
        }
      },
    },
  ];
  attendanceStatus = AttendanceStatus;

  constructor() {}
}
