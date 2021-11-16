import { EditComponent } from "./edit-component";
import { FormControl, FormGroup } from "@angular/forms";

export const FORM_CONTROL_NAME = "testProperty";

/**
 * A simple helper class that sets up a EditComponent with the required FormGroup
 * @param component that extends EditComponent
 */
export function setupEditComponent<T>(component: EditComponent<T>): FormGroup {
  const formControl = new FormControl();
  const formGroup = new FormGroup({ testProperty: formControl });
  component.onInitFromDynamicConfig({
    formControl: formControl,
    propertySchema: {},
    formFieldConfig: { id: FORM_CONTROL_NAME },
  });
  return formGroup;
}
