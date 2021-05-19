import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl, FormControl } from "@angular/forms";
import { FormFieldConfig } from "../../entity-details/form/FormConfig";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { Entity } from "../../../entity/entity";

export interface EditComponentConfig {
  formFieldConfig: FormFieldConfig;
  propertySchema: EntitySchemaField;
  formControl: AbstractControl;
  entity: Entity;
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
  entity: Entity;
  forTable = false;

  onInitFromDynamicConfig(config: EditComponentConfig) {
    if (config.formFieldConfig.forTable) {
      this.forTable = true;
    } else {
      this.placeholder =
        config.formFieldConfig.placeholder || config.propertySchema?.label;
      this.tooltip = config.formFieldConfig.tooltip;
    }
    this.formControlName = config.formFieldConfig.id;
    this.formControl = config.formControl as TypedFormControl<T>;
    this.entity = config.entity;
  }
}
