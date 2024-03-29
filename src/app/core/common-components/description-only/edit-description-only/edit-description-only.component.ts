import { Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormFieldConfig } from "../../entity-form/FormConfig";

@DynamicComponent("EditDescriptionOnly")
@Component({
  selector: "app-edit-description-only",
  template: "<div class='container'>{{formFieldConfig?.label}}</div>",
  styleUrls: ["./edit-description-only.component.scss"],
  standalone: true,
})
export class EditDescriptionOnlyComponent {
  @Input() formFieldConfig: FormFieldConfig;
}
