import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatCheckboxModule } from "@angular/material/checkbox";

export interface NotesDashboardSettingsConfig {
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
    FormsModule,
  ],
  templateUrl: "./notes-dashboard-settings.component.html",
  styleUrls: ["./notes-dashboard-settings.component.scss"],
})
export class NotesDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<NotesDashboardSettingsConfig>;

  localConfig: NotesDashboardSettingsConfig = {
    sinceDays: 28,
    fromBeginningOfWeek: false,
    mode: "with-recent-notes",
  };

  ngOnInit() {
    this.localConfig = {
      sinceDays: this.formControl.value?.sinceDays ?? 28,
      fromBeginningOfWeek: this.formControl.value?.fromBeginningOfWeek ?? false,
      mode: this.formControl.value?.mode ?? "with-recent-notes",
    };
  }

  onSinceDaysChange() {
    this.emitConfigChange();
  }

  onFromBeginningOfWeekChange() {
    this.emitConfigChange();
  }

  onModeChange() {
    this.emitConfigChange();
  }

  emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
