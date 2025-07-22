import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";

export interface AttendanceWeekDashboardSettingsConfig {
  daysOffset?: number;
  periodLabel?: string;
  label?: string;
  attendanceStatusType?: string;
}

@Component({
  selector: "app-attendance-week-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: "./attendance-week-dashboard-settings.component.html",
  styleUrls: ["./attendance-week-dashboard-settings.component.scss"]
})
export class AttendanceWeekDashboardSettingsComponent implements OnInit {
  @Input() config: AttendanceWeekDashboardSettingsConfig = {};
  @Output() configChange = new EventEmitter<AttendanceWeekDashboardSettingsConfig>();

  localConfig: AttendanceWeekDashboardSettingsConfig = {
    daysOffset: 0,
    periodLabel: "",
    label: "",
    attendanceStatusType: ""
  };

  ngOnInit() {
    this.localConfig = {
      daysOffset: this.config.daysOffset ?? 0,
      periodLabel: this.config.periodLabel ?? "",
      label: this.config.label ?? "",
      attendanceStatusType: this.config.attendanceStatusType ?? ""
    };
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }
}