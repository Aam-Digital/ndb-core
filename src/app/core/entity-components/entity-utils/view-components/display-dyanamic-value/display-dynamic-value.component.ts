import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { DisplayPercentageComponent } from "../display-percentage/display-percentage.component";

@DynamicComponent("DisplayDynamicValue")
@Component({
  selector: "app-display-dynamic-value",
  template:
    "<app-display-percentage [value]=result [config]=config></app-display-percentage>",
  standalone: true,
  imports: [DisplayPercentageComponent],
})
export class DisplayDynamicValueComponent
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
