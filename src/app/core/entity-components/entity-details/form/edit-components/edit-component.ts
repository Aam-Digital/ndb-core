import { OnInitDynamicComponent } from "../../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl } from "@angular/forms";
import { FormFieldConfig } from "../FormConfig";
import { EntitySchemaField } from "../../../../entity/schema/entity-schema-field";

interface EditComponentConfig {
  formFieldConfig: FormFieldConfig;
  propertySchema: EntitySchemaField;
  formControl: AbstractControl;
}

export abstract class EditComponent implements OnInitDynamicComponent {
  tooltip: string;
  formControlName: string;
  placeholder: string;
  formControl: AbstractControl;
  enumId: string;

  onInitFromDynamicConfig(config: EditComponentConfig) {
    this.formControlName = config.formFieldConfig.id;
    this.formControl = config.formControl;
    this.tooltip =
      config.formFieldConfig.tooltip || config.propertySchema?.label;
    this.placeholder =
      config.formFieldConfig.placeholder || config.propertySchema?.label;
    this.enumId =
      config.formFieldConfig.enumId || config.propertySchema?.innerDataType;
  }
}
