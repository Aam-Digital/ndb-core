import { Component } from "@angular/core";

@Component({
  selector: "app-widget-headline",
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        font-size: 40pt;
        color: white;
      }
    `,
  ],
})
export class WidgetHeadlineComponent {}
