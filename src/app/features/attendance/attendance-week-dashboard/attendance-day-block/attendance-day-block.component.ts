import { Component, Input } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-attendance-day-block]",
  templateUrl: "./attendance-day-block.component.html",
  styleUrls: ["./attendance-day-block.component.scss"],
  imports: [MatTooltipModule],
})
export class AttendanceDayBlockComponent {
  @Input() attendance?: AttendanceItem;

  get tooltip(): string {
    if (!this.attendance) {
      return $localize`No attendance information`;
    }
    if (this.attendance?.remarks) {
      return this.attendance?.status.label + ": " + this.attendance?.remarks;
    } else {
      return this.attendance?.status.label;
    }
  }
}
