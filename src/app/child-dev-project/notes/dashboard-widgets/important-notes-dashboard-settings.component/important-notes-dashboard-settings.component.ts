import { Component, Input, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EnumDropdownComponent } from "../../../../core/basic-datatypes/configurable-enum/enum-dropdown/enum-dropdown.component";
import { ConfigurableEnumService } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.types";

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
  @Input() formControl: FormControl<ImportantNotesDashboardSettingsConfig>;

  localConfig: ImportantNotesDashboardSettingsConfig = {
    warningLevels: [],
  };

  warningLevelsForm = new FormControl([]);
  private readonly enumService = inject(ConfigurableEnumService);

  ngOnInit() {
    this.localConfig = {
      warningLevels: this.formControl.value?.warningLevels ?? [],
    };

    // Get all options from the enum service
    const allOptions: ConfigurableEnumValue[] =
      this.enumService.getEnum("warning-levels")?.values ?? [];

    // Map stored IDs to option objects for the dropdown
    const selectedObjects = allOptions.filter((opt) =>
      (this.localConfig.warningLevels ?? []).includes(opt.id),
    );

    this.warningLevelsForm.setValue(selectedObjects);

    this.warningLevelsForm.valueChanges.subscribe((values) => {
      // Always store only IDs
      const ids = (values ?? []).map((v) => (typeof v === "string" ? v : v.id));
      this.localConfig.warningLevels = ids;
      this.emitConfigChange();
    });
  }

  private emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
