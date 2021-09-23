import { Component } from "@angular/core";

@Component({
  selector: "app-widget-content",
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        width: 100%;
      }
    `,
  ],
})
export class WidgetContentComponent {}
