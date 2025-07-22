import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";

export interface NotesDashboardSettingsConfig {
  subtitle?: string;
  explanation?: string;
  sinceDays?: number;
  fromBeginningOfWeek?: boolean;
  mode?: string;
}

@Component({
  selector: "app-notes-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: "./notes-dashboard-settings.component.html",
  styleUrls: ["./notes-dashboard-settings.component.scss"]
})
export class NotesDashboardSettingsComponent implements OnInit {
  @Input() config: NotesDashboardSettingsConfig = {};
  @Output() configChange = new EventEmitter<NotesDashboardSettingsConfig>();

  localConfig: NotesDashboardSettingsConfig = {
    subtitle: "",
    explanation: "",
    sinceDays: 28,
    fromBeginningOfWeek: false,
    mode: "with-recent-notes"
  };

  ngOnInit() {
    this.localConfig = {
      subtitle: this.config.subtitle ?? "",
      explanation: this.config.explanation ?? "",
      sinceDays: this.config.sinceDays ?? 28,
      fromBeginningOfWeek: this.config.fromBeginningOfWeek ?? false,
      mode: this.config.mode ?? "with-recent-notes"
    };
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }
}
