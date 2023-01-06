import { Component, Input, OnInit } from "@angular/core";
import { MenuItem } from "../../navigation/menu-item";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../view/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouterLink } from "@angular/router";
import { DashboardWidgetComponent } from "../../dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../dashboard/dashboard-widget/widget-content/widget-content.component";

/**
 * A simple list of shortcuts displayed as a dashboard widget for easy access to important navigation.
 */
@DynamicComponent("DashboardShortcutWidget")
@Component({
  selector: "app-dashboard-shortcut-widget",
  templateUrl: "./dashboard-shortcut-widget.component.html",
  styleUrls: ["./dashboard-shortcut-widget.component.scss"],
  imports: [
    MatTableModule,
    FaDynamicIconComponent,
    RouterLink,
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
export class DashboardShortcutWidgetComponent
  implements OnInitDynamicComponent, OnInit
{
  /** displayed entries, each representing one line displayed as a shortcut */
  @Input() shortcuts: MenuItem[] = [];

  tableDataSource = new MatTableDataSource<MenuItem>();

  onInitFromDynamicConfig(config: any) {
    this.shortcuts = config.shortcuts;
    this.tableDataSource.data = config.shortcuts;
  }

  ngOnInit(): void {
    this.tableDataSource.data = this.shortcuts;
  }
}
