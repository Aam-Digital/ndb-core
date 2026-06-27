import {
  computed,
  Component,
  inject,
  ChangeDetectionStrategy,
  input,
  resource,
  signal,
} from "@angular/core";
import { DefaultValueConfig, DefaultValueMode } from "../default-value-config";
import {
  MatError,
  MatFormField,
  MatFormFieldControl,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms";
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from "@angular/material/button-toggle";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../default-value-strategy.interface";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { MatIconButton } from "@angular/material/button";
import { EntityConstructor } from "../../entity/model/entity";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { AdminDefaultValueDynamicComponent } from "../x-dynamic-placeholder/admin-default-value-dynamic/admin-default-value-dynamic.component";
import { AdminDefaultValueStaticComponent } from "../x-static/admin-default-value-static/admin-default-value-static.component";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { AdminInheritedFieldComponent } from "../../../features/inherited-field/admin-inherited-field/admin-inherited-field.component";

/**
 * Admin UI component used in AdminEntityFieldComponent dialog
 * to let users configure different defaultValue modes for an Entity field.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-default-value",
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    ReactiveFormsModule,
    FormsModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip,
    FaDynamicIconComponent,
    FaIconComponent,
    MatSuffix,
    MatIconButton,
    AdminDefaultValueDynamicComponent,
    AdminDefaultValueStaticComponent,
    AdminInheritedFieldComponent,
  ],
  templateUrl: "./admin-default-value.component.html",
  styleUrl: "./admin-default-value.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: AdminDefaultValueComponent },
  ],
})
export class AdminDefaultValueComponent extends CustomFormControlDirective<DefaultValueConfig> {
  entityType = input.required<EntityConstructor>();
  entitySchemaField = input.required<EntitySchemaField>();

  private readonly modeControl = new FormControl<DefaultValueMode | null>(null);
  private readonly configControl = new FormControl<
    DefaultValueConfig["config"] | null
  >(null, {
    validators: [this.requiredIfModeSelected()],
  });

  form = new FormGroup({
    mode: this.modeControl,
    config: this.configControl,
  });

  private defaultValueStrategies = inject(
    DefaultValueStrategy,
  ) as unknown as DefaultValueStrategy[];

  private readonly modesResource = resource<
    AdminDefaultValueContext[],
    unknown
  >({
    loader: async () =>
      Promise.all(
        this.defaultValueStrategies.map((strategy) => strategy.getAdminUI()),
      ),
  });

  modes = computed(() => this.modesResource.value() ?? []);

  selectedMode = signal<DefaultValueMode | null>(null);

  constructor() {
    super();
    this.syncFormWithValue(this.value);

    this.form.get("mode")?.valueChanges.subscribe((mode) => {
      this.selectedMode.set(mode);
      this.form.get("config")?.setValue(null);
    });

    this.form.get("config")?.valueChanges.subscribe((value) => {
      if (!this.form.get("mode")?.getRawValue() && !!value) {
        // set default mode as "static" after user started typing a value
        this.form.get("mode")?.setValue("static", { emitEvent: false });
      }
    });

    this.form.valueChanges.subscribe(() => this.updateValue());
  }

  override writeValue(value: DefaultValueConfig, notifyFormControl = false) {
    super.writeValue(value, notifyFormControl);
    this.syncFormWithValue(value);
  }

  private syncFormWithValue(value: DefaultValueConfig | null | undefined) {
    const newFormValue = {
      mode: value?.mode ?? null,
      config: value?.config ?? null,
    };

    if (
      JSON.stringify(this.form.getRawValue()) !== JSON.stringify(newFormValue)
    ) {
      this.form.setValue(newFormValue, { emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
      this.selectedMode.set(newFormValue.mode);
    }
  }

  private updateValue() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // TODO: make sure the admin components of each mode are correctly setting themselves as invalid
      return;
    }

    let newConfigValue: DefaultValueConfig = this.form.getRawValue();

    // output as `null` if no value is set to conform with standard form controls
    if (!newConfigValue || (!newConfigValue.mode && !newConfigValue.config)) {
      newConfigValue = null;
    }

    if (JSON.stringify(newConfigValue) !== JSON.stringify(this.value)) {
      this.value = newConfigValue;
    }
  }

  private requiredIfModeSelected(): ValidatorFn {
    return (control) => {
      if (this.modeControl.value && !control.value) {
        return { requiredForMode: true };
      }
      return null;
    };
  }

  clearDefaultValue() {
    // TODO: this causes the config to keep a defaultValue with `config: { value: null }` instead of returning just `null` and deleting the property
    // Need to fix so that the parent form control gets reset to null (without causing errors in the component here internally)
    this.form.setValue({ mode: null, config: null });
  }
}
