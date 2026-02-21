import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnChanges,
  signal,
  SimpleChanges,
} from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { AttendanceItem } from "../model/attendance-item";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { PercentPipe } from "@angular/common";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";
import { WarningLevel } from "#src/app/child-dev-project/warning-level";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { AttendanceDayBlockComponent } from "../attendance-week-dashboard/attendance-day-block/attendance-day-block.component";

/** Thresholds for attendance percentage coloring. */
const THRESHOLD_URGENT = 0.6;
const THRESHOLD_WARNING = 0.8;

@DynamicComponent("DisplayAttendance")
@Component({
  selector: "app-display-attendance",
  templateUrl: "./display-attendance.component.html",
  styleUrls: ["./display-attendance.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PercentPipe,
    TemplateTooltipDirective,
    EntityBlockComponent,
    AttendanceDayBlockComponent,
  ],
})
export class DisplayAttendanceComponent
  extends ViewDirective<AttendanceItem[], any>
  implements OnChanges
{
  items = signal<AttendanceItem[]>([]);

  percentage = computed(() => {
    let present = 0;
    let absent = 0;

    for (const item of this.items()) {
      switch (item.status?.countAs) {
        case AttendanceLogicalStatus.PRESENT:
          present++;
          break;
        case AttendanceLogicalStatus.ABSENT:
          absent++;
          break;
      }
    }

    const total = present + absent;
    return total > 0 ? present / total : undefined;
  });

  warningClass = computed(() => {
    const pct = this.percentage();
    if (pct == null) {
      return "";
    }
    if (pct < THRESHOLD_URGENT) {
      return "w-" + WarningLevel.URGENT;
    } else if (pct < THRESHOLD_WARNING) {
      return "w-" + WarningLevel.WARNING;
    } else {
      return "w-" + WarningLevel.OK;
    }
  });

  // TODO: Remove ngOnChanges once ViewDirective migrates to signal inputs.
  //  Then replace with: items = computed(() => this.value()?.length ? this.value() : []);
  override ngOnChanges(changes?: SimpleChanges) {
    super.ngOnChanges(changes);
    this.items.set(this.value?.length ? this.value : []);
  }
}
