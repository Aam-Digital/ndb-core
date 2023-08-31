import { Component } from "@angular/core";

@Component({
  selector: "app-widget-content",
  template: `<ng-content></ng-content>`,
  styleUrls: ["widget-content.component.scss"],
  standalone: true,
})
export class WidgetContentComponent {}
