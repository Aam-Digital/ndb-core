import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { ViewConfig } from "../../config/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../route-target";

/**
 * Wrapper component for a primary, full page view
 * that takes parameters from the route and passes these on to normal @Input properties.
 *
 * This allows to develop functional feature components in a way to easily reuse them for display
 * as a full page view or in a modal dialog.
 */
@RouteTarget("RoutedView")
@Component({
  selector: "app-routed-view",
  standalone: true,
  imports: [CommonModule, DynamicComponentDirective],
  template: `<ng-container
    *ngIf="component"
    [appDynamicComponent]="{ component: component, config: config }"
  ></ng-container>`,
})
export class RoutedViewComponent<T = any> {
  component: string;
  config: T;

  constructor(route: ActivatedRoute) {
    route.data.subscribe((data: { component: string } & ViewConfig<T>) => {
      this.component = data.component;
      // pass all other config properties to the component as config
      this.config = Object.assign({}, data.config);

      // merge updated config properties from route params
      route.paramMap.subscribe((params) => {
        const config = this.config;
        for (const key of params.keys) {
          config[key] = params.get(key);
        }
        this.config = { ...config };
      });
    });
  }
}
