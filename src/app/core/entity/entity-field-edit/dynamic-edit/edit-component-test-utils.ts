import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";

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
