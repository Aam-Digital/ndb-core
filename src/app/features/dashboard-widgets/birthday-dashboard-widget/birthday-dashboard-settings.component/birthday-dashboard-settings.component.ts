import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";

export interface BirthdayDashboardSettingsConfig {
  subtitle?: string;
  explanation?: string;
  threshold?: number;
  entityType?: string;
  birthdayProperty?: string;
}

@Component({
  selector: "app-birthday-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule
  ],
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"]
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  @Input() config: BirthdayDashboardSettingsConfig = {};
  @Output() configChange = new EventEmitter<BirthdayDashboardSettingsConfig>();

  localConfig: BirthdayDashboardSettingsConfig = {
    subtitle: "",
    explanation: "",
    threshold: 32,
    entityType: "Child",
    birthdayProperty: "dateOfBirth"
  };

  ngOnInit() {
    this.localConfig = {
      subtitle: this.config.subtitle ?? "",
      explanation: this.config.explanation ?? "",
      threshold: this.config.threshold ?? 32,
      entityType: this.config.entityType ?? "Child",
      birthdayProperty: this.config.birthdayProperty ?? "dateOfBirth"
    };
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }
}