import { ChangeDetectionStrategy, Component, computed } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { CustomDatePipe } from "../../date/custom-date.pipe";
import { DateRangeValue } from "../date-range.datatype";
import { findParentOutside, parentRangesResource } from "../parent-ranges";

/**
 * Displays a {@link DateRangeValue} as "start - end", or "from start" / "until end" if one of the dates is missing.
 * The dates of an anonymized record are reduced to the year (like in the date field), with a warning.
 * With the `withinParent` validator, a warning shows when the range goes beyond a linked parent's range.
 */
@DynamicComponent("DisplayDateRange")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-date-range",
  templateUrl: "./display-date-range.component.html",
  imports: [CustomDatePipe, FaDynamicIconComponent, MatTooltipModule],
})
export class DisplayDateRangeComponent extends ViewDirective<DateRangeValue> {
  protected readonly format = computed(() =>
    this.isPartiallyAnonymized() ? "yyyy" : "shortDate",
  );

  private readonly parents = parentRangesResource(() => ({
    record: this.entity(),
    fieldId: this.id(),
    config: this.entity()?.getSchema()?.get(this.id())?.validators
      ?.withinParent,
  }));

  /** name of the first linked parent record whose range this value goes beyond */
  protected readonly outsideParent = computed(() =>
    findParentOutside(this.value(), this.parents.value()),
  );
}
