import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EnumDropdownComponent } from "../../../../core/basic-datatypes/configurable-enum/enum-dropdown/enum-dropdown.component";

export interface ImportantNotesDashboardSettingsConfig {
  warningLevels?: string[];
}

@DynamicComponent("ImportantNotesDashboardSettings")
@Component({
  selector: "app-important-notes-dashboard-settings",
  standalone: true,
  imports: [ReactiveFormsModule, EnumDropdownComponent],
  templateUrl: "./important-notes-dashboard-settings.component.html",
  styleUrls: ["./important-notes-dashboard-settings.component.scss"],
})
export class ImportantNotesDashboardSettingsComponent implements OnInit {
  @Input() config: ImportantNotesDashboardSettingsConfig = {};
  @Output() configChange =
    new EventEmitter<ImportantNotesDashboardSettingsConfig>();

  localConfig: ImportantNotesDashboardSettingsConfig = {
    warningLevels: [],
  };

  warningLevelsForm = new FormControl([]);

  ngOnInit() {
    this.localConfig = {
      warningLevels: this.config.warningLevels ?? [],
    };
    this.warningLevelsForm.setValue(this.localConfig.warningLevels ?? []);
    this.warningLevelsForm.valueChanges.subscribe((values) => {
      this.localConfig.warningLevels = values;
      this.emitConfigChange();
    });
  }

  emitConfigChange() {
    this.configChange.emit({ ...this.localConfig });
  }
}
