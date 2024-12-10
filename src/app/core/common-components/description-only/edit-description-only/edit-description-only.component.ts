import { Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormFieldConfig } from "../../entity-form/FormConfig";

import { MarkdownPageModule } from "app/features/markdown-page/markdown-page.module";

@DynamicComponent("EditDescriptionOnly")
@Component({
  selector: "app-edit-description-only",
  template: ` <markdown>{{ formFieldConfig?.label }}</markdown> `,
  styleUrls: ["./edit-description-only.component.scss"],
  standalone: true,
  imports: [MarkdownPageModule],
})
export class EditDescriptionOnlyComponent {
  @Input() formFieldConfig: FormFieldConfig;
}
