import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { CustomDatePipe } from "../../date/custom-date.pipe";
import { DateRangeValue } from "../date-range.datatype";

/**
 * Displays a {@link DateRangeValue} as "start - end", or "from start" / "until end" if one of the dates is missing.
 */
@DynamicComponent("DisplayDateRange")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-date-range",
  templateUrl: "./display-date-range.component.html",
  imports: [CustomDatePipe],
})
export class DisplayDateRangeComponent extends ViewDirective<DateRangeValue> {}
