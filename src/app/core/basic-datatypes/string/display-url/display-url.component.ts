import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { CommonModule } from "@angular/common";

/**
 * This component displays a URL attribute as a clickable link.
 */
@DynamicComponent("DisplayUrl")
@Component({
  selector: "app-display-url",
  template: `
    <a *ngIf="value" [href]="value" target="_blank">{{ value }}</a>
    <span *ngIf="!value">-</span>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class DisplayUrlComponent extends ViewDirective<string> {}
