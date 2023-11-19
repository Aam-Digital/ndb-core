import { Component, Input } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DatePipe, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * This component displays a date attribute using the shortDate format.
 *
 * Format of the date can be adjusted through config.
 * E.g. `"config": "yyyy-MM-dd
 */
@DynamicComponent("DisplayDate")
@Component({
  selector: "app-display-date",
  templateUrl: "./display-date.component.html",
  standalone: true,
  imports: [DatePipe, NgIf, FontAwesomeModule, MatTooltipModule],
})
export class DisplayDateComponent extends ViewDirective<Date, string> {
  @Input() displayAsAnonymized: boolean;

  /** formatting string for date pipe */
  @Input() config: string;
}
