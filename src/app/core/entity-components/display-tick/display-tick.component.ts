import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-display-tick",
  template: `{{ boolAtr ? "✓" : "" }}`,
})
export class DisplayTickComponent implements OnInitDynamicComponent {
  public boolAtr: boolean;

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.boolAtr = config.entity[config.id];
  }
}
