import { Component, inject, Input, OnInit } from "@angular/core";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DashboardConfig } from "../../dashboard/dashboard/dashboard.component";
import { ConfigService } from "../../config/config.service";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";

/**
 * Admin UI to edit the overall dashboard view with its widgets.
 */
@Component({
  selector: "app-admin-dashboard",
  imports: [DynamicComponentDirective],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: [
    "./admin-dashboard.component.scss",
    "../../dashboard/dashboard/dashboard.component.scss",
  ],
})
export class AdminDashboardComponent implements OnInit {
  @Input() dashboardViewId: string;

  dashboardConfig: DashboardConfig;

  private readonly configService = inject(ConfigService);

  ngOnInit() {
    this.loadDashboardViewConfig();
  }

  private loadDashboardViewConfig() {
    const viewConfig: DynamicComponentConfig<DashboardConfig> =
      this.configService.getConfig(PREFIX_VIEW_CONFIG + this.dashboardViewId);

    this.dashboardConfig = viewConfig?.config;
  }
}
