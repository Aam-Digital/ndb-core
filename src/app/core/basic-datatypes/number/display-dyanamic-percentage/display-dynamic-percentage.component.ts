import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { DisplayPercentageComponent } from "../display-percentage/display-percentage.component";

@DynamicComponent("DisplayDynamicPercentage")
@Component({
  selector: "app-display-dynamic-percentage",
  template:
    "<app-display-percentage [value]=result [config]=config></app-display-percentage>",
  standalone: true,
  imports: [DisplayPercentageComponent],
})
export class DisplayDynamicPercentageComponent
  extends ViewDirective<
    number,
    { total: string; actual: string; numberOfDigits?: number }
  >
  implements OnInit
{
  public result: number;

  ngOnInit() {
    this.result =
      (this.entity[this.config.actual] / this.entity[this.config.total]) * 100;
  }
}
