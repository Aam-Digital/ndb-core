import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayUnit")
@Component({
  selector: "app-display-unit",
  template: '{{ value ? value + " " + unit : "" }}',
  standalone: true,
})
export class DisplayUnitComponent
  extends ViewDirective<string>
  implements OnInit
{
  unit: string;

  ngOnInit() {
    this.unit = this.config || this.entity.getSchema().get(this.id).additional;
  }
}
