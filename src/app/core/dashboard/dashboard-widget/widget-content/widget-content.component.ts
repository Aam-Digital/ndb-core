import { Component } from "@angular/core";

@Component({
  selector: "app-widget-content",
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        width: 100%;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class WidgetContentComponent {}
