import { Component, Input, OnInit } from "@angular/core";
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
  selector: "app-attendance-week-dashboard-settings",
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: "./attendance-week-dashboard-settings.component.html",
  styleUrls: ["./attendance-week-dashboard-settings.component.scss"],
})
export class AttendanceWeekDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<AttendanceWeekDashboardSettingsConfig>;

  localConfig: AttendanceWeekDashboardSettingsConfig = {
    daysOffset: 0,
    periodLabel: "",
    label: "",
    attendanceStatusType: "",
  };

  ngOnInit() {
    this.localConfig = {
      daysOffset: this.formControl.value?.daysOffset ?? 0,
      periodLabel: this.formControl.value?.periodLabel ?? "",
      label: this.formControl.value?.label ?? "",
      attendanceStatusType: this.formControl.value?.attendanceStatusType ?? "",
    };
  }

  emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
