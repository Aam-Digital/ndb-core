import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Note } from "../../model/note";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisplayEntityComponent } from "../../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { AttendanceStatusSelectComponent } from "../../../attendance/attendance-status-select/attendance-status-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";

/**
 * Display a single participant's attendance status in a compact row.
 */
@Component({
  selector: "app-child-meeting-note-attendance",
  templateUrl: "./child-meeting-note-attendance.component.html",
  styleUrls: ["./child-meeting-note-attendance.component.scss"],
  imports: [
    NgIf,
    NgForOf,
    MatButtonModule,
    FontAwesomeModule,
    DisplayEntityComponent,
    AttendanceStatusSelectComponent,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  standalone: true,
})
export class ChildMeetingNoteAttendanceComponent {
  @Input() mobile = false;
  @Input() entity: Note;
  @Input() disabled: boolean = false;
  @Output() change = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
}
