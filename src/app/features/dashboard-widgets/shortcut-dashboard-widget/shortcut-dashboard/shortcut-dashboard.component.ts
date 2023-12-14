import { Component, Input } from "@angular/core";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { UserRoleGuard } from "../../../../core/permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../../../core/permissions/permission-guard/entity-permission.guard";

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
  ],
  standalone: true,
})
export class ShortcutDashboardComponent {
  /** displayed entries, each representing one line displayed as a shortcut */
  @Input() set shortcuts(items: MenuItem[]) {
    this.initAvailableRoutes(items);
  }
  get shortcuts(): MenuItem[] {
    return this._shortcuts;
  }
  private _shortcuts: MenuItem[] = [];

  constructor(
    private roleGuard: UserRoleGuard,
    private permissionGuard: EntityPermissionGuard,
  ) {}

  private async initAvailableRoutes(items: MenuItem[]) {
    const accessibleRoutes = [];
    for (const item of items) {
      if (await this.isAccessibleRouteForUser(item.link)) {
        accessibleRoutes.push(new MenuItem(item.label, item.icon, item.link));
      }
    }
    this._shortcuts = accessibleRoutes;
  }

  private isAccessibleRouteForUser(path: string) {
    return (
      this.roleGuard.checkRoutePermissions(path) &&
      this.permissionGuard.checkRoutePermissions(path)
    );
  }
}
