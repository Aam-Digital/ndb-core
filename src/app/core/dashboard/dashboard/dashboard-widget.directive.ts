import {
  ComponentFactoryResolver,
  Directive,
  Input,
  OnChanges,
  SimpleChanges,
  ViewContainerRef,
} from "@angular/core";
import { LoggingService } from "app/core/logging/logging.service";
import { DASHBOARD_COMPONENT_MAP } from "../dashboard-component-map";
import { DashboardWidgetConfig } from "../dashboard-widget-config.interface";
import { DashboardWidgetComponent } from "../dashboard-widget.component";

/**
 * Directive to mark a template into which a DashboardWidgetComponent should be loaded.
 * Pass the DashboardWidgetConfig into the directive to define the widget.
 */
@Directive({
  selector: "[appDashboardWidget]",
})
export class DashboardWidgetDirective implements OnChanges {
  @Input() appDashboardWidget: DashboardWidgetConfig;

  constructor(
    public viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private loggingService: LoggingService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loadWidgetComponent();
  }

  private loadWidgetComponent() {
    if (!this.appDashboardWidget) {
      return;
    }

    const component = DASHBOARD_COMPONENT_MAP.get(
      this.appDashboardWidget.component
    );
    if (!component) {
      this.loggingService.warn(
        "Could not load dashboard widget - component not found: " +
          this.appDashboardWidget.component
      );
      return;
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory<
      DashboardWidgetComponent
    >(component);

    this.viewContainerRef.clear();

    const componentRef = this.viewContainerRef.createComponent<
      DashboardWidgetComponent
    >(componentFactory);
    componentRef.instance.initFromConfig(this.appDashboardWidget.config);
  }
}
