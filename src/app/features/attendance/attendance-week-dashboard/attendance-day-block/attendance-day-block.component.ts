import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-attendance-day-block",
  templateUrl: "./attendance-day-block.component.html",
  styleUrls: ["./attendance-day-block.component.scss"],
  imports: [MatTooltipModule],
})
export class AttendanceDayBlockComponent {
  attendance = input<AttendanceItem>();

  readonly tooltip = computed(() => {
    const attendance = this.attendance();
    if (!attendance) {
      return $localize`No attendance information`;
    }
    if (attendance.remarks) {
      return attendance.status.label + ": " + attendance.remarks;
    }
    return attendance.status.label;
  });
}
