import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EventAttendance } from "../../../attendance/model/event-attendance";
import { AttendanceLogicalStatus } from "../../../attendance/model/attendance-status";

@Component({
  selector: "app-child-meeting-note-attendance",
  templateUrl: "./child-meeting-note-attendance.component.html",
  styleUrls: ["./child-meeting-note-attendance.component.scss"],
})
export class ChildMeetingNoteAttendanceComponent {
  @Input() childId: string;
  @Input() attendance: EventAttendance;
  @Output() change = new EventEmitter();
  @Output() remove = new EventEmitter();
  showRemarks: boolean = false;

  ATTENDANCE_STATUS = AttendanceLogicalStatus;

  setStatus(present: boolean) {
    // TODO this.attendance.status = AttendanceStatus.ABSENT;
    this.change.emit(this.attendance);
  }
}
