import { Component, Input } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DatePipe } from "@angular/common";
import { CustomDatePipe } from "../custom-date.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * This component displays a date attribute using the shortDate format.
 */
@DynamicComponent("DisplayDate")
@Component({
  selector: "app-display-date",
  templateUrl: "./display-date.component.html",
  imports: [CustomDatePipe, DatePipe, FontAwesomeModule, MatTooltipModule],
})
export class DisplayDateComponent extends ViewDirective<Date, string> {
  @Input() displayAsAnonymized: boolean;

  /** formatting string for date pipe */
  @Input() declare config: string;
}
