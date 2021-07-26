import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl, FormControl } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

/**
 * The interface for the configuration which is created by the form- or the entity-subrecord-component.
 */
export interface EditPropertyConfig {
  /**
   * The configuration for this form field.
   */
  formFieldConfig: FormFieldConfig;

  /**
   * If available, the schema for the property which is displayed in this field.
   */
  propertySchema: EntitySchemaField;

  /**
   * The form control for this field which is part of a form group of the table/form component.
   */
  formControl: AbstractControl;
}

/**
 * A simple extension of the Form control which allows to access the form type-safe.
 * <T> refers to the type of the value which is managed in this control.
 */
export class TypedFormControl<T> extends FormControl {
  value: T;
  setValue(
    value: T,
    options?: {
      onlySelf?: boolean;
      emitEvent?: boolean;
      emitModelToViewChange?: boolean;
      emitViewToModelChange?: boolean;
    }
  ) {
    super.setValue(value, options);
  }
}

/**
 * A simple helper class which sets up all the required information for edit-components.
 * <T> refers to the type of the value which is processed in the component.
 */
export abstract class EditComponent<T> implements OnInitDynamicComponent {
  /**
   * The tooltip to be displayed.
   */
  tooltip: string;

  /**
   * The name of the form control.
   */
  formControlName: string;

  /**
   * A label for this component.
   */
  label: string;

  /**
   * The typed form control.
   */
  formControl: TypedFormControl<T>;

  onInitFromDynamicConfig(config: EditPropertyConfig) {
    if (!config.formFieldConfig.forTable) {
      this.label = config.formFieldConfig.label || config.propertySchema?.label;
      this.tooltip = config.formFieldConfig.tooltip;
    }
    this.formControlName = config.formFieldConfig.id;
    this.formControl = config.formControl as TypedFormControl<T>;
  }
}
