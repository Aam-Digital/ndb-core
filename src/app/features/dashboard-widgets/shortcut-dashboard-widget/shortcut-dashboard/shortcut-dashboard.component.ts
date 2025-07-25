import { Component, Input, inject } from "@angular/core";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { RoutePermissionsService } from "../../../../core/config/dynamic-routing/route-permissions.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";
import { LocationStrategy } from "@angular/common";
import { AlertService } from "../../../../core/alerts/alert.service";
import { Clipboard } from "@angular/cdk/clipboard";

/**
 * A simple list of shortcuts displayed as a dashboard widget for easy access to important navigation.
 */
@DynamicComponent("ShortcutDashboard")
@Component({
  selector: "app-shortcut-dashboard",
  templateUrl: "./shortcut-dashboard.component.html",
  styleUrls: ["./shortcut-dashboard.component.scss"],
  imports: [
    DashboardListWidgetComponent,
    MatTableModule,
    FaDynamicIconComponent,
    RouterLink,
    FaIconComponent,
    MatIconButton,
    MatTooltip,
  ],
})
export class ShortcutDashboardComponent {
  private routePermissionsService = inject(RoutePermissionsService);
  private locationStrategy = inject(LocationStrategy);
  private clipboard = inject(Clipboard);
  private alertService = inject(AlertService);

  /** displayed entries, each representing one line displayed as a shortcut */
  @Input() set shortcuts(items: MenuItem[]) {
    this.routePermissionsService
      .filterPermittedRoutes(items)
      .then((res) => (this._shortcuts = res));
  }
  get shortcuts(): MenuItem[] {
    return this._shortcuts;
  }
  _shortcuts: MenuItem[] = [];

  @Input() subtitle: string =
    $localize`:dashboard widget subtitle:Quick Actions`;
  @Input() explanation: string =
    $localize`:dashboard widget explanation:Shortcuts to quickly navigate to common actions`;

  async copyAbsoluteLink2Clipboard(link: string) {
    const externalLink =
      window.location.origin + this.locationStrategy.prepareExternalUrl(link);
    const success = this.clipboard.copy(externalLink);
    if (success) {
      this.alertService.addInfo("Link copied: " + externalLink);
    }
  }
}
