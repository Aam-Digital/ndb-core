import { ComponentFixture } from "@angular/core/testing";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";

/**
 * Helper function for modern Angular components that extend CustomFormControlDirective.
 *
 * Pass the `fixture` parameter for components that use signal `input()` for formFieldConfig,
 * as direct property assignment does not work with signal inputs.
 *
 * @param component that extends CustomFormControlDirective
 * @param propertyName (optional) the name of the property for which the edit component is created
 * @param schema (optional) additional schema information for the entity field
 * @param fixture (optional) required for components using signal input() for formFieldConfig
 */
export function setupCustomFormControlEditComponent<T>(
  component: CustomFormControlDirective<T>,
  propertyName = "testProperty",
  schema: any = {},
  fixture?: ComponentFixture<any>,
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
    if (fixture) {
      fixture.componentRef.setInput("formFieldConfig", {
        id: propertyName,
        ...schema,
      });
    } else if (typeof (component as any).formFieldConfig !== "function") {
      // Skip signal inputs (functions) — they cannot be overwritten; pass fixture to use setInput() instead
      (component as any).formFieldConfig = { id: propertyName, ...schema };
    } else {
      throw new Error(
        `setupCustomFormControlEditComponent requires a fixture for "${propertyName}" because formFieldConfig is a signal input. Use fixture.componentRef.setInput("formFieldConfig", value).`,
      );
    }
  }

  return formGroup;
}
