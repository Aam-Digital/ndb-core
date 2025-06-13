import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";


/**
 * This component displays a URL attribute as a clickable link.
 */
@DynamicComponent("DisplayUrl")
@Component({
  selector: "app-display-url",
  template: `
    @if (value) {
      <a [href]="value" target="_blank" class="clickable">{{
        value
      }}</a>
    }
    @if (!value) {
      <span>-</span>
    }
    `,
  standalone: true,
  imports: [],
})
export class DisplayUrlComponent extends ViewDirective<string> {}
