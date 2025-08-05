import { Component, Input, LOCALE_ID, OnChanges, inject } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { DatePipe, formatPercent, PercentPipe } from "@angular/common";
import { TemplateTooltipDirective } from "../../../core/common-components/template-tooltip/template-tooltip.directive";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";

/**
 * Display attendance details of a single period for a participant as a compact block.
 */
@Component({
  selector: "app-attendance-block",
  templateUrl: "./attendance-block.component.html",
  styleUrls: ["./attendance-block.component.scss"],
  imports: [
    PercentPipe,
    DatePipe,
    TemplateTooltipDirective,
    AttendanceCalendarComponent,
  ],
})
export class AttendanceBlockComponent implements OnChanges {
  private locale = inject(LOCALE_ID);

  @Input() attendanceData: ActivityAttendance;
  @Input() forChild: string;
  LStatus = AttendanceLogicalStatus;
  logicalCount: { [key in AttendanceLogicalStatus]?: number };

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
    const percentage = this.attendanceData.getAttendancePercentage(
      this.forChild,
    );
    if (!Number.isFinite(percentage)) {
      return "-";
    } else {
      return formatPercent(percentage, this.locale, "1.0-0");
    }
  }

  get warningLevel(): string {
    return this.attendanceData.getWarningLevel(this.forChild);
  }
}
