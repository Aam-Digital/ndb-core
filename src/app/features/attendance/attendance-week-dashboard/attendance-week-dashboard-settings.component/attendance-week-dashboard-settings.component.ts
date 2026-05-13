import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
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

  localConfig: AttendanceWeekDashboardSettingsConfig = {
    daysOffset: 0,
    periodLabel: "",
    label: "",
    attendanceStatusType: "",
  };

  constructor() {
    effect(() => {
      const formControl = this.formControl();
      this.localConfig = {
        daysOffset: formControl.value?.daysOffset ?? 0,
        periodLabel: formControl.value?.periodLabel ?? "",
        label: formControl.value?.label ?? "",
        attendanceStatusType: formControl.value?.attendanceStatusType ?? "",
      };
    });
  }

  emitConfigChange() {
    this.formControl().setValue({ ...this.localConfig });
  }
}
