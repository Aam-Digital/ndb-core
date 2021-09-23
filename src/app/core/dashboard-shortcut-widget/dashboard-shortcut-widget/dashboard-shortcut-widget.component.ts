import { Component, Input, OnInit } from "@angular/core";
import { MenuItem } from "../../navigation/menu-item";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

/**
 * A simple list of shortcuts displayed as a dashboard widget for easy access to important navigation.
 */
@Component({
  selector: "app-dashboard-shortcut-widget",
  templateUrl: "./dashboard-shortcut-widget.component.html",
})
export class DashboardShortcutWidgetComponent
  implements OnInit, OnInitDynamicComponent {
  /** displayed entries, each representing one line displayed as a shortcut */
  @Input() shortcuts: MenuItem[] = [];

  constructor() {}

  ngOnInit(): void {}

  onInitFromDynamicConfig(config: any) {
    this.shortcuts = config.shortcuts;
  }
}
