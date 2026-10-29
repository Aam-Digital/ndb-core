import { InputSignal } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { asArray } from "#src/app/utils/asArray";

/**
 * Interface for custom edit components.
 * The inputs are passed on by the DynamicEditComponent.
 */
export interface EditComponent {
  formFieldConfig?: InputSignal<FormFieldConfig | undefined>;
  entity?: InputSignal<Entity | undefined>;
  highlightAdded?: InputSignal<boolean>;
}

/**
 * The values that the entity has saved in the field of the edit component,
 * to highlight the selected values that are added to them (only if `highlightAdded` is set).
 *
 * They are taken from the entity, because the form control can already hold a new value
 * when the edit component is created (e.g. a suggested value in the "Update related records" dialog).
 */
export function getExistingValuesToHighlight<V>(
  component: EditComponent,
): V[] | undefined {
  if (!component.highlightAdded?.()) {
    return undefined;
  }
  const fieldId = component.formFieldConfig?.()?.id;
  return asArray<V>(component.entity?.()?.[fieldId] ?? []);
}
