import { Component, Inject, Input, LOCALE_ID, OnChanges } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { formatPercent } from "@angular/common";

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
  LStatus = AttendanceLogicalStatus;
  logicalCount: { [key in AttendanceLogicalStatus]?: number };

  constructor(@Inject(LOCALE_ID) private locale: string) {
  }

  ngOnChanges() {
    this.logicalCount =
      this.attendanceData.individualLogicalStatusCounts.get(this.forChild) ??
      {};
  }

  get attendanceDescription(): string {
    return `${this.logicalCount[this.LStatus.PRESENT]} / ${
      (this.logicalCount[this.LStatus.PRESENT] || 0) +
      (this.logicalCount[this.LStatus.ABSENT] || 0)
    }`;
  }

  get attendancePercentage(): string {
    const percentage = this.attendanceData.getAttendancePercentage(this.forChild);
    if (!Number.isFinite(percentage)) {
      return '-'
    } else {
      return formatPercent(percentage, this.locale, "1.0-0");
    }
  }

  get warningLevel(): string {
    return this.attendanceData.getWarningLevel(this.forChild)
  }
}
