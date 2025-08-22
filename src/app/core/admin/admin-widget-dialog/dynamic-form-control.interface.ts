import { FormControl } from "@angular/forms";

/**
 * A component that is used through the DynamicComponentDirective
 * and has a form control input to communicate changes.
 */
export interface DynamicFormControlComponent<T> {
  formControl: FormControl<T>;
}
