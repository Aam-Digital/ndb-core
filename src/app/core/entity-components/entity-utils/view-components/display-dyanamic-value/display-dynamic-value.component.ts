import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayDynamicValue")
@Component({
  selector: "app-display-dynamic-value",
  template: "{{ result }}",
  standalone: true,
})
export class DisplayDynamicValueComponent
  extends ViewDirective<
    number,
    { total: string; actual: string; numberOfDigits?: number }
  >
  implements OnInit
{
  public result: string;

  ngOnInit() {
    this.result =
      (
        (this.entity[this.config.actual] / this.entity[this.config.total]) *
        100
      ).toFixed(this.config.numberOfDigits ?? 2) + " %";
  }
}
