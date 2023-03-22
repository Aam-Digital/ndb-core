import { Component, Input } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { DatePipe } from "@angular/common";

/**
 * This component displays a date attribute using the shortDate format.
 *
 * Format of the date can be adjusted through config.
 * E.g. `"config": "yyyy-MM-dd
 */
@DynamicComponent("DisplayDate")
@Component({
  selector: "app-display-date",
  template: `{{ value | date : config }}`,
  standalone: true,
  imports: [DatePipe],
})
export class DisplayDateComponent extends ViewDirective<Date, string> {}
