import { Component, Input } from "@angular/core";
import { EventAttendance } from "../../../model/event-attendance";

@Component({
  selector: "app-attendance-day-block]",
  templateUrl: "./attendance-day-block.component.html",
  styleUrls: ["./attendance-day-block.component.scss"],
})
export class AttendanceDayBlockComponent {
  @Input() attendance?: EventAttendance;

  get tooltip(): string {
    if (!this.attendance) {
      return $localize`No attendance information`
    }
    if (this.attendance?.remarks) {
      return this.attendance?.status.label + ": " + this.attendance?.remarks;
    } else {
      return this.attendance?.status.label;
    }
  }
}
