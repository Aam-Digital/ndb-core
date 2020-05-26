import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MeetingNoteAttendance } from "../../meeting-note-attendance";

@Component({
  selector: "app-child-meeting-note-attendance",
  templateUrl: "./child-meeting-note-attendance.component.html",
  styleUrls: ["./child-meeting-note-attendance.component.scss"],
})
export class ChildMeetingNoteAttendanceComponent {
  @Input() noteChildAttendance: MeetingNoteAttendance;
  @Output() change = new EventEmitter();
  @Output() remove = new EventEmitter();
  showRemarks: boolean = false;
}
