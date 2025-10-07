import { EditComponent } from "./edit-component";
import {
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { Entity } from "../model/entity";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";

/**
 * A simple helper class that sets up a EditComponent with the required FormGroup
 * @param component that extends EditComponent
 * @param propertyName (optional) the name of the property for which the edit component is created
 * @param schema (optional) additional schema information for the entity field
 */
export function setupEditComponent<T>(
  component: EditComponent<T>,
  propertyName = "testProperty",
  schema: EntitySchemaField = {},
): UntypedFormGroup {
  const formControl = new UntypedFormControl();
  const fromGroupConfig = {};
  fromGroupConfig[propertyName] = formControl;
  const formGroup = new UntypedFormGroup(fromGroupConfig);
  component.formControl = formControl;
  component.formFieldConfig = { id: propertyName, ...schema };
  component.entity = new Entity();
  return formGroup;
}

/**
 * Helper function for modern Angular components that extend CustomFormControlDirective.
 *
 * WARNING: This doesn't seem to always assign and trigger change detection for properties like `formFieldConfig` correctly.
 *
 * @param component that extends CustomFormControlDirective
 * @param propertyName (optional) the name of the property for which the edit component is created
 * @param schema (optional) additional schema information for the entity field
 */
export function setupCustomFormControlEditComponent<T>(
  component: CustomFormControlDirective<T>,
  propertyName = "testProperty",
  schema: any = {},
): UntypedFormGroup {
  const formControl = new UntypedFormControl();
  const formGroup = new UntypedFormGroup({
    [propertyName]: formControl,
  });

  // Set up the component's ngControl to point to our form control
  component.ngControl = {
    control: formControl,
  } as any;

  // Set formFieldConfig if the component has it
  if ("formFieldConfig" in component) {
    (component as any).formFieldConfig = { id: propertyName, ...schema };
  }

  return formGroup;
}
