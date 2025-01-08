import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DefaultValueOptionsComponent } from 'app/core/admin/admin-entity-details/admin-entity-field/default-value-options/default-value-options.component';
import { FieldGroup } from 'app/core/entity-details/form/field-group';
import { EntityRegistry } from 'app/core/entity/database-entity.decorator';
import { EditComponent } from 'app/core/entity/default-datatype/edit-component';
import { EntityConstructor } from 'app/core/entity/model/entity';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormConfig } from 'app/core/entity-details/form/form.component';
import { DefaultValueConfig } from 'app/core/entity/schema/default-value-config';
import { HelpButtonComponent } from 'app/core/common-components/help-button/help-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-edit-prefilled-values',
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
    MatButtonModule
  ],
  templateUrl: './edit-prefilled-values.component.html',
  styleUrls: ['./edit-prefilled-values.component.scss'],
})
export class EditPrefilledValuesComponent extends EditComponent<FieldGroup[]> implements OnInit {
  entityConstructor!: EntityConstructor;
  publicFormConfig!: FormConfig;
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

    this.entityConstructor = this.entities.get(this.entity['entity']);
    this.publicFormConfig = { fieldGroups: this.formControl.getRawValue() };
    this.populateAvailableFields();
    this.initializePrefilledValues();
    this.prefilledValueSettings.valueChanges.subscribe((value) => this.updateFieldGroups(value));
  }

  get prefilledValues(): FormArray {
    return this.prefilledValueSettings.get('prefilledvalue') as FormArray;
  }

  private populateAvailableFields(): void {
    const usedFields = this.getUsedFields();

    this.availableFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([key]) => usedFields.includes(key))
      .filter(([, value]) => value.label)
      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);
  }

  private initializePrefilledValues(): void {
    this.publicFormConfig.fieldGroups.forEach((group) => {
      group.fields.forEach((field: any) => {
        const fieldId = typeof field === 'string' ? field : field.id;
        const defaultValue = typeof field === 'string' ? null : field.defaultValue;
  
        if (fieldId && defaultValue) {
          setTimeout(() => {
            this.prefilledValues.push(
              this.fb.group({
                field: [fieldId],
                defaultValue: [defaultValue],
              }),
            );
          });
        }
      });
    });
  }
  
  addField(): void {
    if (!this.availableFields.length) {
      console.warn('No fields available to add.');
      return;
    }

      this.prefilledValues.push(this.fb.group({ field: [''], defaultValue: [] }));
  }

  removeField(index: number): void {
    if (index < 0 || index >= this.prefilledValues.length) {
      return;
    }
  
    const fieldToUpdate = this.prefilledValues.at(index).value.field;
  
    this.publicFormConfig.fieldGroups.forEach((group) => {
      group.fields = group.fields.map((field: any) => {
        if (typeof field === 'object' && field.id === fieldToUpdate) {
          return field.id;
        }
        return field;
      });
    });
    this.prefilledValues.removeAt(index);
    this.formControl.markAsDirty();
  }
  

  private updateFieldGroups(value): void {
    if (!value?.prefilledvalue) return;

    const fieldGroups = this.publicFormConfig.fieldGroups;

    value.prefilledvalue.forEach((prefilledValue) => {
      const fieldId = prefilledValue.field;
      const defaultValue = prefilledValue.defaultValue;

      if (!fieldId || !defaultValue) {
        return;
      }

      this.updateFieldInGroups(fieldGroups, fieldId, defaultValue);
    });

    this.formControl.markAsDirty();
  }

  private updateFieldInGroups(fieldGroups: FieldGroup[], fieldId: string, defaultValue: DefaultValueConfig): void {
    const updatedValue = { id: fieldId, defaultValue };

    fieldGroups.forEach((group) => {
      const fieldIndex = group.fields.findIndex((field: any) =>
        typeof field === 'string' ? field === fieldId : field.id === fieldId,
      );

      if (fieldIndex !== -1) {
        group.fields[fieldIndex] = updatedValue;
      }
    });
  }

  private getUsedFields(): string[] {
    return this.publicFormConfig.fieldGroups.flatMap((group) =>
      group.fields.map((field) => {
        if (typeof field === 'string') {
          return field;
        } else if ('id' in field) {
          return field.id;
        } else {
          return null;
        }
      }).filter((field): field is string => !!field)
    );
  }
  
}
