import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EventAttendance } from "../../../attendance/model/event-attendance";

/**
 * Display a single participant's attendance status in a compact row.
 */
@Component({
  selector: "app-child-meeting-note-attendance",
  templateUrl: "./child-meeting-note-attendance.component.html",
  styleUrls: ["./child-meeting-note-attendance.component.scss"],
})
export class ChildMeetingNoteAttendanceComponent {
  @Input() childId: string;
  @Input() attendance: EventAttendance;
  @Output() changeClicked = new EventEmitter();
  @Output() removeClicked = new EventEmitter();
}
