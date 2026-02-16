import { Component, inject, Input, LOCALE_ID, OnChanges } from "@angular/core";
import { ActivityAttendance } from "../../model/activity-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { formatPercent, PercentPipe } from "@angular/common";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";
import { AttendanceCalendarComponent } from "../../analysis/attendance-calendar/attendance-calendar.component";

/**
 * Display attendance details of a single period for a participant as a compact block.
 * This shows calculated attendance of multiple events.
 */
@Component({
  selector: "app-attendance-block",
  templateUrl: "./attendance-block.component.html",
  styleUrls: ["./attendance-block.component.scss"],
  imports: [
    PercentPipe,
    CustomDatePipe,
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
