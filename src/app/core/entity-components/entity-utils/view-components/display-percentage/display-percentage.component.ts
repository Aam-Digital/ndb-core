import { Component, HostBinding, OnInit } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { CommonModule } from "@angular/common";

@DynamicComponent("DisplayPercentage")
@Component({
  selector: "app-display-percentage",
  template: "{{ value ? (value | number : pipe) + '%' : '-' }}",
  standalone: true,
  imports: [CommonModule],
})
export class DisplayPercentageComponent
  extends ViewDirective<number>
  implements OnInit
{
  @HostBinding("style") style = {};
  pipe: string;

  /**
   * returns a css-compatible color value from green to red using the given
   * input value
   * @param percent The percentage from 0-100 (both inclusive). 0 will be completely red, 100 will be completely green
   * Everything between will have suitable colors (orange, yellow,...)
   * If the color is NaN, the color will be a light grey
   */
  private static fromPercent(percent: number): string {
    if (Number.isNaN(percent)) {
      return "rgba(130,130,130,0.4)";
    }
    // the hsv color-value is to be between 0 (red) and 120 (green)
    // percent is between 0-100, so we have to normalize it first
    const color = (percent / 100) * 120;
    return "hsl(" + color + ", 100%, 85%)";
  }

  ngOnInit() {
    this.pipe =
      "1." +
      (this.config.decimalPlaces
        ? this.config.decimalPlaces + "-" + this.config.decimalPlaces
        : "0-0");
    this.style = {
      "background-color": DisplayPercentageComponent.fromPercent(this.value),
      "border-radius": "5%",
      padding: "5px",
      width: "min-content",
    };
  }
}
