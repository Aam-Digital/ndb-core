import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-display-text-array",
  template: "{{textArrayAsText()}}",
})
export class DisplayTextArrayComponent implements OnInitDynamicComponent {
  public textArray = [];

  constructor() {}

  textArrayAsText(): string {
    if (this.textArray.length > 2) {
      return (
        this.textArray.slice(0, 2).join(", ") +
        " and " +
        String(this.textArray.length - 2) +
        " more"
      );
    } else {
      return this.textArray.join(", ");
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.textArray = config.entity[config.id];
  }
}
