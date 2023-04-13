import { EditComponent } from "./edit-component";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { Entity } from "../../../entity/model/entity";

/**
 * A simple helper class that sets up a EditComponent with the required FormGroup
 * @param component that extends EditComponent
 * @param propertyName (optional) the name of the property for which the edit component is created
 * @param propertySchema (optional) the property scheme that is passed to the edit component
 */
export function setupEditComponent<T>(
  component: EditComponent<T>,
  propertyName = "testProperty",
  propertySchema: object = {}
): UntypedFormGroup {
  const formControl = new UntypedFormControl();
  const fromGroupConfig = {};
  fromGroupConfig[propertyName] = formControl;
  const formGroup = new UntypedFormGroup(fromGroupConfig);
  component.formControl = formControl;
  component.propertySchema = propertySchema;
  component.formFieldConfig = { id: propertyName };
  component.entity = new Entity();
  return formGroup;
}
