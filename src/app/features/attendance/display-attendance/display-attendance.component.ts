import { Component, inject, LOCALE_ID, OnInit } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { PercentPipe } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";

@DynamicComponent("DisplayAttendance")
@Component({
  selector: "app-display-attendance",
  templateUrl: "./display-attendance.component.html",
  styleUrls: ["./display-attendance.component.scss"],
  imports: [PercentPipe, MatProgressBarModule, TemplateTooltipDirective],
})
export class DisplayAttendanceComponent
  extends ViewDirective<ActivityAttendance, any>
  implements OnInit
{
  private locale = inject(LOCALE_ID);

  percentage: number;
  statusCounts: { [key in AttendanceLogicalStatus]?: number } = {};
  LStatus = AttendanceLogicalStatus;

  ngOnInit() {
    if (!this.value) {
      return;
    }

    const childId = this.config?.forChild;

    if (childId) {
      this.percentage = this.value.getAttendancePercentage(childId);
      this.statusCounts =
        this.value.individualLogicalStatusCounts.get(childId) ?? {};
    } else {
      this.percentage = this.value.getAttendancePercentageAverage();
      this.statusCounts = {
        [AttendanceLogicalStatus.PRESENT]: this.value.countTotalPresent(),
        [AttendanceLogicalStatus.ABSENT]: this.value.countTotalAbsent(),
      };
    }
  }

  getBarColor(): string {
    return this.value?.getColor(this.config?.forChild) || "";
  }
}
