import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { AdminDefaultValueComponent } from "../../../core/default-values/admin-default-value/admin-default-value.component";
import { DefaultValueConfig } from "../../../core/default-values/default-value-config";

const defaultValueCompleteValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const val: DefaultValueConfig = control.value;
  if (!val) {
    return { incompleteDefaultValue: true };
  }
  if (val.mode && !val.config) {
    return { incompleteDefaultValue: true };
  }
  if (
    val.config &&
    typeof val.config === "object" &&
    "value" in val.config &&
    (val.config as { value: unknown }).value == null
  ) {
    return { incompleteDefaultValue: true };
  }
  return null;
};

@DynamicComponent("EditPrefilledValuesComponent")
@Component({
  selector: "app-edit-prefilled-values",
  standalone: true,
  imports: [
    AdminDefaultValueComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    HelpButtonComponent,
    FontAwesomeModule,
    MatButtonModule,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./edit-prefilled-values.component.html",
  styleUrls: ["./edit-prefilled-values.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: EditPrefilledValuesComponent },
  ],
})
export class EditPrefilledValuesComponent
  extends CustomFormControlDirective<Record<string, DefaultValueConfig>>
  implements OnInit, EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  entityConstructor: EntityConstructor;
  entitySchemaField: EntitySchemaField;

  private readonly entities = inject(EntityRegistry);
  private readonly fb = inject(FormBuilder);

  readonly isDisabled = signal(false);

  prefilledValueSettings = this.fb.group({
    prefilledValue: this.fb.array([]),
  });

  ngOnInit(): void {
    const entity = this.entity();
    if (!entity) return;

    this.entityConstructor = this.entities.get(entity["entity"]);
    this.initializePrefilledValues();
    this.prefilledValueSettings.valueChanges.subscribe((value) =>
      this.updateFieldGroups(value as { prefilledValue: PrefilledValue[] }),
    );

    this.formControl.statusChanges.subscribe(() => {
      const disabled = this.formControl.disabled;
      this.isDisabled.set(disabled);
      if (disabled) {
        this.prefilledValueSettings.disable({ emitEvent: false });
      } else {
        this.prefilledValueSettings.enable({ emitEvent: false });
      }
    });

    if (this.formControl.disabled) {
      this.isDisabled.set(true);
      this.prefilledValueSettings.disable({ emitEvent: false });
    }
  }

  get prefilledValues(): FormArray {
    return this.prefilledValueSettings.get("prefilledValue") as FormArray;
  }

  private initializePrefilledValues(): void {
    let fields = this.formControl.value;

    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      for (const [fieldId, defVal] of Object.entries(
        fields as Record<string, DefaultValueConfig>,
      )) {
        this.prefilledValues.push(
          this.fb.group({
            field: [fieldId, Validators.required],
            defaultValue: [defVal, defaultValueCompleteValidator],
          }),
        );
      }
      return;
    }
  }

  addPrefilledFields(): void {
    this.prefilledValues.push(
      this.fb.group({
        field: ["", Validators.required],
        defaultValue: [{ mode: "static" }, defaultValueCompleteValidator],
      }),
    );
  }

  removePrefilledFields(index: number): void {
    if (index < 0 || index >= this.prefilledValues.length) {
      return;
    }

    this.prefilledValues.removeAt(index);
    this.formControl.markAsDirty();
  }

  getSchemaField(fieldId: string): EntitySchemaField {
    return this.entityConstructor?.schema.get(fieldId);
  }

  private updateFieldGroups(value: { prefilledValue: PrefilledValue[] }): void {
    if (!value?.prefilledValue) return;
    if (this.prefilledValueSettings.invalid) {
      this.formControl.setErrors({ invalid: true });
      this.prefilledValueSettings.markAllAsTouched();
      return;
    }

    const updatedFields: Record<string, DefaultValueConfig> = {};
    value.prefilledValue.forEach(({ field, defaultValue }) => {
      if (field && defaultValue != null) updatedFields[field] = defaultValue;
    });

    const hasChanged =
      JSON.stringify(updatedFields) !==
      JSON.stringify(this.formControl.value ?? {});
    this.formControl.setValue(updatedFields);
    if (hasChanged) {
      this.formControl.markAsDirty();
    }
  }
}

interface PrefilledValue {
  field: string;
  defaultValue: DefaultValueConfig;
  hideFromForm?: boolean;
}
