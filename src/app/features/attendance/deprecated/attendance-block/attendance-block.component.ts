import {
  Component,
  inject,
  LOCALE_ID,
  ChangeDetectionStrategy,
  computed,
  input,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AttendanceBlockComponent {
  private locale = inject(LOCALE_ID);

  attendanceData = input<ActivityAttendance>();
  forChild = input<string>();
  LStatus = AttendanceLogicalStatus;
  readonly logicalCount = computed<{
    [key in AttendanceLogicalStatus]?: number;
  }>(() => {
    const attendanceData = this.attendanceData();
    const forChild = this.forChild();
    if (!attendanceData || !forChild) {
      return {};
    }
    return attendanceData.individualLogicalStatusCounts.get(forChild) ?? {};
  });

  readonly attendanceDescription = computed(() => {
    const logicalCount = this.logicalCount();
    return `${logicalCount[this.LStatus.PRESENT]} / ${
      (logicalCount[this.LStatus.PRESENT] || 0) +
      (logicalCount[this.LStatus.ABSENT] || 0)
    }`;
  });

  readonly attendancePercentage = computed(() => {
    const attendanceData = this.attendanceData();
    const forChild = this.forChild();
    if (!attendanceData || !forChild) {
      return "-";
    }
    const percentage = attendanceData.getAttendancePercentage(forChild);
    if (!Number.isFinite(percentage)) {
      return "-";
    }
    return formatPercent(percentage, this.locale, "1.0-0");
  });

  readonly warningLevel = computed(() => {
    const attendanceData = this.attendanceData();
    const forChild = this.forChild();
    if (!attendanceData || !forChild) {
      return "";
    }
    return attendanceData.getWarningLevel(forChild);
  });
}
