import { EditComponent } from "./edit-component";
import { FormControl, FormGroup } from "@angular/forms";

/**
 * A simple helper class that sets up a EditComponent with the required FormGroup
 * @param component that extends EditComponent
 * @param propertyName (optional) the name of the property for which the edit component is created
 */
export function setupEditComponent<T>(
  component: EditComponent<T>,
  propertyName = "testProperty"
): FormGroup {
  const formControl = new FormControl();
  const fromGroupConfig = {};
  fromGroupConfig[propertyName] = formControl;
  const formGroup = new FormGroup(fromGroupConfig);
  component.onInitFromDynamicConfig({
    formControl: formControl,
    propertySchema: {},
    formFieldConfig: { id: propertyName },
  });
  return formGroup;
}
