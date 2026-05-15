import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  input,
  linkedSignal,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-notes-dashboard-settings",
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
export class NotesDashboardSettingsComponent {
  formControl = input.required<FormControl<NotesDashboardSettingsConfig>>();

  sinceDays = linkedSignal(() => this.formControl().value?.sinceDays ?? 28);
  fromBeginningOfWeek = linkedSignal(
    () => this.formControl().value?.fromBeginningOfWeek ?? false,
  );
  mode = linkedSignal(
    () => this.formControl().value?.mode ?? "with-recent-notes",
  );

  localConfig = computed<NotesDashboardSettingsConfig>(() => ({
    sinceDays: this.sinceDays(),
    fromBeginningOfWeek: this.fromBeginningOfWeek(),
    mode: this.mode(),
  }));

  constructor() {
    effect(() => {
      this.formControl().setValue(this.localConfig());
    });
  }

  onSinceDaysChange(sinceDays: number) {
    this.sinceDays.set(sinceDays);
    this.formControl().markAsDirty();
  }

  onFromBeginningOfWeekChange(fromBeginningOfWeek: boolean) {
    this.fromBeginningOfWeek.set(fromBeginningOfWeek);
    this.formControl().markAsDirty();
  }

  onModeChange(mode: string) {
    this.mode.set(mode);
    this.formControl().markAsDirty();
  }
}
