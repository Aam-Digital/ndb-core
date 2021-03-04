import { Component, OnInit } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-display-text-array",
  template: "{{textArrayAsText()}}",
})
export class DisplayTextArrayComponent implements OnInitDynamicComponent {
  public textArray = [];

  constructor() {}

  textArrayAsText(): string {
    return this.textArray.join(", ");
  }

  onInitFromDynamicConfig(config: any) {
    this.textArray = config.entity[config.id];
  }
}
