import { Entity } from "#src/app/core/entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

/**
 * Interface for custom edit components.
 * The inputs are passed on by the DynamicEditComponent.
 */
export interface EditComponent {
  formFieldConfig?: FormFieldConfig;
  entity?: Entity;
}
