import { Component, Input, OnChanges } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";

@Component({
  selector: "app-attendance-block",
  templateUrl: "./attendance-block.component.html",
  styleUrls: ["./attendance-block.component.scss"],
})
export class AttendanceBlockComponent implements OnChanges {
  @Input() attendanceData: ActivityAttendance;
  @Input() forChild: string;
  tooltip = false;
  tooltipTimeout;
  LStatus = AttendanceLogicalStatus;
  logicalCount: { [key in AttendanceLogicalStatus]?: number };

  constructor() {}

  ngOnChanges() {
    this.logicalCount =
      this.attendanceData.individualLogicalStatusCounts.get(this.forChild) ??
      {};
  }

  showTooltip() {
    this.tooltip = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
  }
  hideTooltip() {
    this.tooltipTimeout = setTimeout(() => (this.tooltip = false), 250);
  }
}
