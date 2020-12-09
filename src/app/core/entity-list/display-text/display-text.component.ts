import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-text",
  template: `{{ text }}`,
})
export class DisplayTextComponent implements OnInitDynamicComponent {
  public text = "";

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.text = config.entity[config.id];
  }
}
