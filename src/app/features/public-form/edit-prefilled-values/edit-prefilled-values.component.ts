import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { DefaultValueOptionsComponent } from 'app/core/admin/admin-entity-details/admin-entity-field/default-value-options/default-value-options.component';
import { FieldGroup } from 'app/core/entity-details/form/field-group';
import { EntityRegistry } from 'app/core/entity/database-entity.decorator';
import { EditComponent } from 'app/core/entity/default-datatype/edit-component';
import { EntityConstructor } from 'app/core/entity/model/entity';
import { EntitySchemaField } from 'app/core/entity/schema/entity-schema-field';
import { PublicFormConfig } from '../public-form-config';
import { FormConfig } from 'app/core/entity-details/form/form.component';
@Component({
  selector: 'app-edit-prefilled-values',
  standalone: true,
  imports: [DefaultValueOptionsComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './edit-prefilled-values.component.html',
  styleUrls: ['./edit-prefilled-values.component.scss']
})
export class EditPrefilledValuesComponent extends EditComponent<FieldGroup[]> implements OnInit {
  entityConstructor: EntityConstructor;
  entitySchemaField: EntitySchemaField;
  schemaFieldsForm: FormGroup;

  availableFields: string[] = [];

  constructor(private fb: FormBuilder) {
    super();
  }

  prefilledValueSettings = this.fb.group({
    prefilledvalue: this.fb.array([]),
  });

  private entities = inject(EntityRegistry);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity['entity']);
      this.availableFields = this.entity['columns']
        ?.flatMap((column: any) => column.fields) 
      console.log(this.availableFields, "Available fields for dropdown");
    }
  }

  get prefilledValues(): FormArray {
    return this.prefilledValueSettings.get('prefilledvalue') as FormArray;
  }

  addField(): void {
    const fieldGroup = this.fb.group({
      field: [''],
      defaultValue: [''],
    });
    this.prefilledValues.push(fieldGroup);
  }

  removeField(index: number): void {
    this.prefilledValues.removeAt(index);
  }
}

