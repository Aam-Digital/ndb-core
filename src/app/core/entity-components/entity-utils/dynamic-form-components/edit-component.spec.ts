import { EditComponent } from "./edit-component";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";

/**
 * A simple helper class that sets up a EditComponent with the required FormGroup
 * @param component that extends EditComponent
 * @param propertyName (optional) the name of the property for which the edit component is created
 */
export function setupEditComponent<T>(
  component: EditComponent<T>,
  propertyName = "testProperty"
): UntypedFormGroup {
  const formControl = new UntypedFormControl();
  const fromGroupConfig = {};
  fromGroupConfig[propertyName] = formControl;
  const formGroup = new UntypedFormGroup(fromGroupConfig);
  component.onInitFromDynamicConfig({
    formControl: formControl,
    propertySchema: {},
    formFieldConfig: { id: propertyName },
  });
  return formGroup;
}
