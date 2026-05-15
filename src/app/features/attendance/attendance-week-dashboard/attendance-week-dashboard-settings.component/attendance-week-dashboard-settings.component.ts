import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
  linkedSignal,
} from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, FormControl } from "@angular/forms";

export interface AttendanceWeekDashboardSettingsConfig {
  daysOffset?: number;
  periodLabel?: string;
  label?: string;
  attendanceStatusType?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-attendance-week-dashboard-settings",
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: "./attendance-week-dashboard-settings.component.html",
  styleUrls: ["./attendance-week-dashboard-settings.component.scss"],
})
export class AttendanceWeekDashboardSettingsComponent {
  formControl =
    input.required<FormControl<AttendanceWeekDashboardSettingsConfig>>();

  daysOffset = linkedSignal(() => this.formControl().value?.daysOffset ?? 0);
  periodLabel = linkedSignal(() => this.formControl().value?.periodLabel ?? "");
  label = linkedSignal(() => this.formControl().value?.label ?? "");
  attendanceStatusType = linkedSignal(
    () => this.formControl().value?.attendanceStatusType ?? "",
  );

  constructor() {
    effect(() => {
      this.formControl().setValue({
        daysOffset: this.daysOffset(),
        periodLabel: this.periodLabel(),
        label: this.label(),
        attendanceStatusType: this.attendanceStatusType(),
      });
    });
  }
}
