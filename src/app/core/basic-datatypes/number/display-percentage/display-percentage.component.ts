import {
  Component,
  HostBinding,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { CommonModule } from "@angular/common";

@DynamicComponent("DisplayPercentage")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-percentage",
  template:
    "{{ value() !== undefined ? (value() | number : numberFormat()) + '%' : '-' }}",
  imports: [CommonModule],
})
export class DisplayPercentageComponent extends ViewDirective<
  number,
  { decimalPlaces?: number }
> {
  private static fromPercent(percent: number): string {
    if (Number.isNaN(percent)) {
      return "rgba(130,130,130,0.4)";
    }
    const color = (percent / 100) * 120;
    return "hsl(" + color + ", 100%, 85%)";
  }

  readonly numberFormat = computed(() => {
    const config = this.config();
    return (
      "1." +
      (config?.decimalPlaces
        ? config.decimalPlaces + "-" + config.decimalPlaces
        : "0-0")
    );
  });

  private readonly _computedStyle = computed(() => ({
    "background-color": DisplayPercentageComponent.fromPercent(this.value()),
    "border-radius": "5%",
    padding: "5px",
    width: "min-content",
  }));

  @HostBinding("style") get style() {
    return this._computedStyle();
  }
}
