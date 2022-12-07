import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Note } from "../../model/note";

/**
 * Display a single participant's attendance status in a compact row.
 */
@Component({
  selector: "app-child-meeting-note-attendance",
  templateUrl: "./child-meeting-note-attendance.component.html",
  styleUrls: ["./child-meeting-note-attendance.component.scss"],
})
export class ChildMeetingNoteAttendanceComponent {
  @Input() mobile = false;
  @Input() entity: Note;
  @Input() disabled: boolean = false;
  @Output() change = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
}
