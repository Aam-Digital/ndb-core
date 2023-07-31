import { Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { FormFieldConfig } from "../../../entity-form/entity-form/FormConfig";

@DynamicComponent("EditDescriptionOnly")
@Component({
  selector: "app-edit-description-only",
  template: "{{formFieldConfig?.label}}",
  standalone: true,
})
export class EditDescriptionOnlyComponent {
  @Input() formFieldConfig: FormFieldConfig;
}
