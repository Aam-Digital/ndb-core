import { Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormFieldConfig } from "../../entity-form/FormConfig";

import { MarkdownPageModule } from "app/features/markdown-page/markdown-page.module";

@DynamicComponent("EditDescriptionOnly")
@Component({
  selector: "app-edit-description-only",
  template: `
    <div class="container">
      <label>{{ formFieldConfig?.label }}</label>
      <div
        class="markdown-content"
        markdown
        [data]="formFieldConfig?.value || ''"
      ></div>
    </div>
  `,
  styleUrls: ["./edit-description-only.component.scss"],
  standalone: true,
  imports: [MarkdownPageModule],
})
export class EditDescriptionOnlyComponent {
  @Input() formFieldConfig: FormFieldConfig;
}
