import { Component, Input, OnChanges } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";

/**
 * Display attendance details of a single period for a participant as a compact block.
 */
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
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltip = true), 1000);
  }
  hideTooltip() {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltip = false), 150);
  }
  get attendanceDescription(): string {
    return `${this.logicalCount[this.LStatus.PRESENT]} / ${
      (this.logicalCount[this.LStatus.PRESENT] || 0) +
      (this.logicalCount[this.LStatus.ABSENT] || 0)
    }`;
  }
}
