import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { DefaultValueOptionsComponent } from "app/core/admin/admin-entity-details/admin-entity-field/default-value-options/default-value-options.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { EntityConstructor } from "app/core/entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { DefaultValueConfig } from "app/core/entity/schema/default-value-config";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";

@Component({
  selector: "app-edit-prefilled-values",
  standalone: true,
  imports: [
    DefaultValueOptionsComponent,
    CommonModule,
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
})
export class EditPrefilledValuesComponent
  extends EditComponent<FormFieldConfig[]>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  formConfig: FormConfig;
  FormFieldConfig: FormFieldConfig;
  defaultValue: DefaultValueConfig;

  private entities = inject(EntityRegistry);

  private fb = inject(FormBuilder);

  prefilledValueSettings = this.fb.group({
    prefilledValue: this.fb.array([]),
  });

  override ngOnInit(): void {
    if (!this.entity) return;

    this.entityConstructor = this.entities.get(this.entity["entity"]);
    this.initializePrefilledValues();
    this.prefilledValueSettings.valueChanges.subscribe((value) =>
      this.updateFieldGroups(value),
    );
  }

  get prefilledValues(): FormArray {
    return this.prefilledValueSettings.get("prefilledValue") as FormArray;
  }

  private initializePrefilledValues(): void {
    const fields = this.formControl.value as FormFieldConfig[];
    if (!fields || !Array.isArray(fields)) return;

    fields.forEach((field) => {
      this.prefilledValues.push(
        this.fb.group({
          field: [field.id, Validators.required],
          defaultValue: [field.defaultValue],
          hideFromForm: [field.hideFromForm ?? true],
        }),
      );
    });
  }

  addPrefilledFields(): void {
    this.prefilledValues.push(
      this.fb.group({
        field: ["", Validators.required],
        defaultValue: {
          mode: "static",
        },
        hideFromForm: true,
      }),
    );
  }

  get isAddDisabled(): boolean {
    return this.prefilledValues.invalid;
  }

  removePrefilledFields(index: number): void {
    if (index < 0 || index >= this.prefilledValues.length) {
      return;
    }

    this.prefilledValues.removeAt(index);
    this.formControl.markAsDirty();
  }

  private updateFieldGroups(value): void {
    if (!value?.prefilledValue) return;

    const updatedFields: FormFieldConfig[] = value.prefilledValue.map(
      (prefilledValue) => ({
        id: prefilledValue.field,
        defaultValue: prefilledValue.defaultValue,
        hideFromForm: prefilledValue.hideFromForm ?? true,
      }),
    );
    this.formControl.setValue(updatedFields);
    this.formControl.markAsDirty();
  }
}
