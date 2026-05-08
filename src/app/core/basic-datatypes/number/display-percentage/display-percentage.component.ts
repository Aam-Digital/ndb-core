import { Component, computed, ChangeDetectionStrategy } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { CommonModule } from "@angular/common";

@DynamicComponent("DisplayPercentage")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-percentage",
  template:
    "{{ value() !== undefined ? (value() | number : numberFormat()) + '%' : '-' }}",
  styleUrl: "./display-percentage.component.scss",
  imports: [CommonModule],
  host: {
    "[style.background-color]": "_computedBackground()",
  },
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

  readonly _computedBackground = computed(() =>
    DisplayPercentageComponent.fromPercent(this.value()),
  );
}
