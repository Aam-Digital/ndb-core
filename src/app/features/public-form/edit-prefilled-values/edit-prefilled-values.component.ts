import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormArray, FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { DefaultValueOptionsComponent } from "app/core/admin/admin-entity-details/admin-entity-field/default-value-options/default-value-options.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";
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
  ],
  templateUrl: "./edit-prefilled-values.component.html",
  styleUrls: ["./edit-prefilled-values.component.scss"],
})
export class EditPrefilledValuesComponent
  extends EditComponent<FieldGroup[]>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  formConfig: FormConfig;
  availableFields: string[] = [];

  prefilledValueSettings = this.fb.group({
    prefilledvalue: this.fb.array([]),
  });

  private entities = inject(EntityRegistry);

  constructor(private fb: FormBuilder) {
    super();
  }

  override ngOnInit(): void {
    if (!this.entity) return;

    this.entityConstructor = this.entities.get(this.entity["entity"]);
    this.formConfig = { fieldGroups: this.formControl.getRawValue() };
    this.populateAvailableFields();
    this.initializePrefilledValues();
    this.prefilledValueSettings.valueChanges.subscribe((value) =>
      this.updateFieldGroups(value),
    );
  }

  get prefilledValues(): FormArray {
    return this.prefilledValueSettings.get("prefilledvalue") as FormArray;
  }

  private populateAvailableFields(): void {
    this.availableFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([, value]) => value.label)
      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);
  }

  private initializePrefilledValues(): void {
    if (!this.formConfig.fieldGroups) return;
    this.formConfig.fieldGroups.forEach((group) => {
      group.fields.forEach((field: FormFieldConfig) => {
        const fieldId = typeof field === "string" ? field : field.id;
        const defaultValue =
          typeof field === "string" ? null : field.defaultValue;

        if (fieldId) {
          this.prefilledValues.push(
            this.fb.group({
              field: [fieldId],
              defaultValue: [defaultValue],
              hideFromForm: [field.hideFromForm ?? true],
            }),
          );
        }
      });
    });
  }

  addRestrictedPrefilled(): void {
    if (!this.availableFields.length) {
      return;
    }

    this.prefilledValues.push(
      this.fb.group({
        field: [""],
        defaultValue: null,
        hideFromForm: [true],
      }),
    );
  }

  removeRestrictedPrefilled(index: number): void {
    if (index < 0 || index >= this.prefilledValues.length) {
      return;
    }

    const fieldToRemove = this.prefilledValues.at(index).value.field;

    this.formConfig.fieldGroups.forEach((group) => {
      group.fields = group.fields.filter((field: any) => {
        if (typeof field === "object") {
          return field.id !== fieldToRemove;
        }
        return field !== fieldToRemove;
      });
    });

    this.prefilledValues.removeAt(index);

    this.formControl.markAsDirty();
  }

  private updateFieldGroups(value): void {
    if (!value?.prefilledvalue) return;

    const fieldGroups = this.formConfig.fieldGroups || [];

    if (fieldGroups.length === 0) {
      fieldGroups.push({ fields: [] });
    }

    value.prefilledvalue.forEach((prefilledValue) => {
      const fieldId = prefilledValue.field;
      const defaultValue = prefilledValue.defaultValue;

      if (!fieldId) {
        return;
      }
      this.updateFieldInGroup(
        fieldGroups[0].fields as unknown as FormFieldConfig[],
        fieldId,
        defaultValue,
      );
    });

    setTimeout(() => this.formControl.setValue(fieldGroups));
    this.formControl.markAsDirty();
  }

  private updateFieldInGroup(
    fields: (string | FormFieldConfig)[],
    fieldId: string,
    defaultValue: DefaultValueConfig | null,
  ): void {
    const updatedValue: FormFieldConfig = defaultValue
      ? { id: fieldId, defaultValue, hideFromForm: true }
      : { id: fieldId, hideFromForm: true };

    const fieldIndex = fields.findIndex((field) =>
      typeof field === "string" ? field === fieldId : field.id === fieldId,
    );

    if (fieldIndex !== -1) {
      if (typeof fields[fieldIndex] === "object") {
        const existingField = fields[fieldIndex] as FormFieldConfig;
        existingField.defaultValue = defaultValue;
        existingField.hideFromForm = true;
      }
    } else {
      fields.push(updatedValue);
    }
  }
}
