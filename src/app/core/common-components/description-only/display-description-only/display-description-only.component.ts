import { Component } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { MarkdownPageModule } from "app/features/markdown-page/markdown-page.module";

/**
 * Display only a text block to provide explanation within a form
 * without an actual user input field.
 */
@DynamicComponent("DisplayDescriptionOnly")
@Component({
  selector: "app-display-description-only",
  template: ` <markdown>{{ formFieldConfig?.label }}</markdown> `,
  styleUrls: ["./display-description-only.component.scss"],
  imports: [MarkdownPageModule],
})
export class DisplayDescriptionOnlyComponent extends ViewDirective<undefined, undefined> {
}
