import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-display-date",
  template: `{{ dateText | date: "shortDate" }}`,
})
export class DisplayDateComponent implements OnInitDynamicComponent {
  public dateText = "";

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.dateText = config.entity[config.id];
  }
}
