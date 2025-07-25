import { Component, Injector, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { ViewConfig } from "../../config/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../route-target";
import { DynamicComponentPipe } from "../../config/dynamic-components/dynamic-component.pipe";
import { AbstractViewComponent } from "../abstract-view/abstract-view.component";

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
  imports: [CommonModule, DynamicComponentPipe],
  templateUrl: "./routed-view.component.html",
})
export class RoutedViewComponent<T = any> extends AbstractViewComponent {
  component: string;
  config: any;

  constructor() {
    const route = inject(ActivatedRoute);
    const injector = inject(Injector);

    super(injector, false);

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
