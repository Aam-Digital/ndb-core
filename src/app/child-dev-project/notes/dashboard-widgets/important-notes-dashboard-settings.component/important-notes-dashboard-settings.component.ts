import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";

export interface ImportantNotesDashboardSettingsConfig {
  subtitle?: string;
  explanation?: string;
  warningLevels?: string[];
}

@DynamicComponent("ImportantNotesDashboardSettings")
@Component({
  selector: "app-important-notes-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule
  ],
  templateUrl: "./important-notes-dashboard-settings.component.html",
  styleUrls: ["./important-notes-dashboard-settings.component.scss"]
})
export class ImportantNotesDashboardSettingsComponent implements OnInit {
  @Input() config: ImportantNotesDashboardSettingsConfig = {};
  @Output() configChange = new EventEmitter<ImportantNotesDashboardSettingsConfig>();

  localConfig: ImportantNotesDashboardSettingsConfig = {
    subtitle: "",
    explanation: "",
    warningLevels: []
  };

  ngOnInit() {
    this.localConfig = {
      subtitle: this.config.subtitle ?? "",
      explanation: this.config.explanation ?? "",
      warningLevels: this.config.warningLevels ?? ["WARNING", "URGENT"]
    };
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }
}
