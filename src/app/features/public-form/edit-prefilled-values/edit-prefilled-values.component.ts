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
  extends EditComponent<{ [key: string]: DefaultValueConfig }>
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
    let fields = this.formControl.value;

    // todo: check/update this with existing prefilled array
    if (
      Array.isArray(fields) &&
      fields.length === 1 &&
      typeof fields[0] === "object" &&
      !Array.isArray(fields[0])
    ) {
      fields = fields[0];
    }

    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      for (const [fieldId, defVal] of Object.entries(
        fields as Record<string, DefaultValueConfig>,
      )) {
        this.prefilledValues.push(
          this.fb.group({
            field: [fieldId, Validators.required],
            defaultValue: [defVal],
          }),
        );
      }
      return;
    }

    // Old format: array of PrefilledValue
    if (Array.isArray(fields)) {
      type PossiblePrefilledItem = PrefilledValue & { id?: string };
      (fields as PossiblePrefilledItem[]).forEach((item) => {
        this.prefilledValues.push(
          this.fb.group({
            field: [item.field ?? item.id, Validators.required],
            defaultValue: [item.defaultValue],
          }),
        );
      });
    }
  }

  addPrefilledFields(): void {
    this.prefilledValues.push(
      this.fb.group({
        field: ["", Validators.required],
        defaultValue: { mode: "static" },
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

    const objFormat: { [key: string]: DefaultValueConfig } = {};
    value.prefilledValue.forEach(({ field, defaultValue }) => {
      if (field) objFormat[field] = defaultValue;
    });

    this.formControl.setValue(objFormat);
    this.formControl.markAsDirty();
  }
}

interface PrefilledValue {
  field: string;
  defaultValue: DefaultValueConfig;
  hideFromForm?: boolean;
}
