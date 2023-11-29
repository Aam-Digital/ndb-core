import { Component } from "@angular/core";
import { FormFieldComponent } from "../form-field/form-field.component";

/**
 * Generic component to display the label of one form field of an entity
 * without having to handle overwriting the field config with potentially missing schema field details.
 */
@Component({
  selector: "app-form-field-label",
  template: "{{ _field?.label ?? _field?.id }}",
  standalone: true,
})
export class FormFieldComponentLabel extends FormFieldComponent {}
