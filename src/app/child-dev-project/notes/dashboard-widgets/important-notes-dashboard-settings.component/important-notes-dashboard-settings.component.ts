import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EnumDropdownComponent } from "../../../../core/basic-datatypes/configurable-enum/enum-dropdown/enum-dropdown.component";

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
    FormsModule,
    ReactiveFormsModule,
    EnumDropdownComponent
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

  warningLevelsForm = new FormControl([]);

  ngOnInit() {
    this.localConfig = {
      subtitle: this.config.subtitle ?? "",
      explanation: this.config.explanation ?? "",
      warningLevels: this.config.warningLevels ?? []
    };
    this.warningLevelsForm.setValue(this.localConfig.warningLevels ?? []);
    this.warningLevelsForm.valueChanges.subscribe(values => {
      this.localConfig.warningLevels = values;
      this.emitConfigChange();
    });
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }

  onWarningLevelsChange(values: string[]) {
    this.localConfig.warningLevels = values;
    this.emitConfigChange();
  }
}