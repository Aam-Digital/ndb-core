import { Component } from "@angular/core";

@Component({
  selector: "app-widget-subheadline",
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        font-size: 14px;
        color: white;
      }
    `,
  ],
})
export class WidgetSubheadlineComponent {}
