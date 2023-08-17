import { Component, Input } from "@angular/core";
import { MenuItem } from "../../../../core/navigation/menu-item";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../../../core/view/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

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
  @Input() shortcuts: MenuItem[] = [];
}
