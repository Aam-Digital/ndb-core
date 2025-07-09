import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigStatic } from "../default-value-config-static";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { EntityForm } from "app/core/common-components/entity-form/entity-form.service";
import { Entity } from "app/core/entity/model/entity";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

/**
 * UI to edit a static default value in the Admin UI.
 * Note that the Input/Output of values is in database-format (not entity-format)
 * as this is the format how it should be saved in the config.
 */
@Component({
  selector: "app-admin-default-value-static",
  imports: [ReactiveFormsModule, EntityFieldEditComponent],
  templateUrl: "./admin-default-value-static.component.html",
  styleUrl: "./admin-default-value-static.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueStaticComponent,
    },
  ],
})
export class AdminDefaultValueStaticComponent
  extends CustomFormControlDirective<DefaultValueConfigStatic>
  implements OnInit, OnChanges
{
  @Input() entitySchemaField: EntitySchemaField;

  targetFieldConfig: FormFieldConfig;

  formControl: FormControl<string>;
  staticvalueForm: EntityForm<Entity>;

  private readonly entitySchemaService = inject(EntitySchemaService);

  ngOnInit() {
    this.formControl = new FormControl(this.getInternalValue(this.value));
    this.formControl.valueChanges.subscribe((v) => this.emitNewValue(v));

    this.updateTargetFieldConfig();

    const formGroup = new FormGroup({
      [this.targetFieldConfig.id]: this.formControl,
    });
    this.staticvalueForm = {
      formGroup,
    } as unknown as EntityForm<Entity>;

    this.ngControl?.valueChanges.subscribe(
      (newValue: DefaultValueConfigStatic) => {
        this.formControl.setValue(this.getInternalValue(newValue), {
          emitEvent: false,
        });
      },
    );
  }

  private getInternalValue(defaultValueConfig: DefaultValueConfigStatic) {
    let value = defaultValueConfig?.value ?? null;
    if (value) {
      value = this.entitySchemaService.valueToEntityFormat(
        value,
        this.entitySchemaField,
      );
    }
    return value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entitySchemaField) return;

    if (!this.targetFieldConfig) {
      this.updateTargetFieldConfig();
    } else if (this.entitySchemaField.id !== this.targetFieldConfig.id) {
      this.updateFormControlId();
    } else {
      Object.assign(this.targetFieldConfig, this.entitySchemaField);
    }
  }

  private updateTargetFieldConfig() {
    const newConfig = {
      id: "defaultValueId",
      ...this.entitySchemaField,
    };

    if (JSON.stringify(this.targetFieldConfig) !== JSON.stringify(newConfig)) {
      this.targetFieldConfig = newConfig;
    }
  }

  private updateFormControlId() {
    if (!this.staticvalueForm || !this.formControl) return;

    (this.staticvalueForm.formGroup as FormGroup).removeControl(
      this.targetFieldConfig.id,
    );
    // added new control for the updated schemafield Id
    (this.staticvalueForm.formGroup as FormGroup).addControl(
      this.targetFieldConfig.id,
      this.formControl,
    );
  }

  /**
   * Set the CustomFormControl value as output (after transforming it to desired format).
   * @param newValue
   * @private
   */
  private emitNewValue(newValue: any) {
    // to the outside we want to set the value in the database format for simplified storing in the config object
    if (newValue) {
      newValue = this.entitySchemaService.valueToDatabaseFormat(
        newValue,
        this.entitySchemaField,
      );
    }

    this.value = { value: newValue };
  }
}
