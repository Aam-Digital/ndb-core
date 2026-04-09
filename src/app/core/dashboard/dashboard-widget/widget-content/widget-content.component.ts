import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-widget-content",
  template: `<ng-content></ng-content>`,
  styleUrls: ["widget-content.component.scss"],
  standalone: true,
})
export class WidgetContentComponent {}
