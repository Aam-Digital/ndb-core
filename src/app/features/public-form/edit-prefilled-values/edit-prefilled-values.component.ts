import { Component, inject, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AdminDefaultValueComponent } from "../../../core/default-values/admin-default-value/admin-default-value.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { EntityConstructor } from "app/core/entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DefaultValueConfig } from "../../../core/default-values/default-value-config";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";

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
})
export class EditPrefilledValuesComponent
  extends EditComponent<FormFieldConfig[]>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  entitySchemaField: EntitySchemaField;

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
      this.updateFieldGroups(value as { prefilledValue: PrefilledValue[] }),
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

    const updatedFields: FormFieldConfig[] = value.prefilledValue.map(
      ({ field, defaultValue, hideFromForm }) => {
        return {
          id: field,
          defaultValue,
          hideFromForm: hideFromForm ?? true,
        };
      },
    );

    this.formControl.setValue(updatedFields);
    this.formControl.markAsDirty();
  }
}

interface PrefilledValue {
  field: string;
  defaultValue: DefaultValueConfig;
  hideFromForm?: boolean;
}
