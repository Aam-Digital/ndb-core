import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  input,
  linkedSignal,
} from "@angular/core";
import { FormControl, FormsModule, ValidatorFn } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntityTypeSelectComponent } from "../../../../core/entity/entity-type-select/entity-type-select.component";

export interface NotesDashboardSettingsConfig {
  entityType?: string;
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
    EntityTypeSelectComponent,
  ],
  templateUrl: "./notes-dashboard-settings.component.html",
  styleUrls: ["./notes-dashboard-settings.component.scss"],
})
export class NotesDashboardSettingsComponent {
  formControl = input.required<FormControl<NotesDashboardSettingsConfig>>();

  entityType = linkedSignal(() => this.formControl().value?.entityType);
  sinceDays = linkedSignal(() => this.formControl().value?.sinceDays ?? 28);
  fromBeginningOfWeek = linkedSignal(
    () => this.formControl().value?.fromBeginningOfWeek ?? false,
  );
  mode = linkedSignal(
    () => this.formControl().value?.mode ?? "with-recent-notes",
  );

  localConfig = computed<NotesDashboardSettingsConfig>(() => ({
    entityType: this.entityType(),
    sinceDays: this.sinceDays(),
    fromBeginningOfWeek: this.fromBeginningOfWeek(),
    mode: this.mode(),
  }));

  /** the widget cannot display anything without an entity type, so saving is blocked until one is selected */
  private readonly requireEntityType: ValidatorFn = (control) =>
    control.value?.entityType ? null : { entityTypeRequired: true };

  constructor() {
    effect(() => {
      const control = this.formControl();
      if (!control.hasValidator(this.requireEntityType)) {
        control.addValidators(this.requireEntityType);
      }
      control.setValue(this.localConfig());
    });
  }

  onEntityTypeChange(entityType: string) {
    this.entityType.set(entityType);
    this.formControl().markAsDirty();
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
