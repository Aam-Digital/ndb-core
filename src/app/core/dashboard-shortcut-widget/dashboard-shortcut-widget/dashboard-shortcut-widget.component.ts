import { Component, Input } from "@angular/core";
import { MenuItem } from "../../navigation/menu-item";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../view/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { DashboardListWidgetComponent } from "../../dashboard/dashboard-list-widget/dashboard-list-widget.component";

/**
 * A simple list of shortcuts displayed as a dashboard widget for easy access to important navigation.
 */
@DynamicComponent("DashboardShortcutWidget")
@Component({
  selector: "app-dashboard-shortcut-widget",
  templateUrl: "./dashboard-shortcut-widget.component.html",
  styleUrls: ["./dashboard-shortcut-widget.component.scss"],
  imports: [
    DashboardListWidgetComponent,
    MatTableModule,
    FaDynamicIconComponent,
    RouterLink,
  ],
  standalone: true,
})
export class DashboardShortcutWidgetComponent
  implements OnInitDynamicComponent
{
  /** displayed entries, each representing one line displayed as a shortcut */
  @Input() shortcuts: MenuItem[] = [];

  onInitFromDynamicConfig(config: any) {
    this.shortcuts = config.shortcuts;
  }
}
