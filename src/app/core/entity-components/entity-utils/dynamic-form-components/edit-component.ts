import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl, FormControl } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";

export interface EditPropertyConfig {
  formFieldConfig: FormFieldConfig;
  propertySchema: EntitySchemaField;
  formControl: AbstractControl;
}

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

export abstract class EditComponent<T> implements OnInitDynamicComponent {
  tooltip: string;
  formControlName: string;
  placeholder: string;
  formControl: TypedFormControl<T>;

  onInitFromDynamicConfig(config: EditPropertyConfig) {
    if (!config.formFieldConfig.forTable) {
      this.placeholder =
        config.formFieldConfig.placeholder || config.propertySchema?.label;
      this.tooltip = config.formFieldConfig.tooltip;
    }
    this.formControlName = config.formFieldConfig.id;
    this.formControl = config.formControl as TypedFormControl<T>;
  }
}
