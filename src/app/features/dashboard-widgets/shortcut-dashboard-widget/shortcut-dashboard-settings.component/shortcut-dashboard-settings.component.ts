import { Component, inject, Input, OnInit } from "@angular/core";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormControl, FormsModule } from "@angular/forms";
import { MenuItemFormComponent } from "#src/app/menu-item-form/menu-item-form.component";
import { ShortcutDashboardConfig } from "../shortcut-dashboard-config";
import { DynamicFormControlComponent } from "#src/app/core/admin/admin-widget-dialog/dynamic-form-control.interface";
import { MenuService } from "#src/app/core/ui/navigation/menu.service";

@DynamicComponent("ShortcutDashboardSettings")
@Component({
  selector: "app-shortcut-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MenuItemFormComponent,
  ],
  templateUrl: "./shortcut-dashboard-settings.component.html",
  styleUrls: ["./shortcut-dashboard-settings.component.scss"],
})
export class ShortcutDashboardSettingsComponent
  implements OnInit, DynamicFormControlComponent<ShortcutDashboardConfig>
{
  private readonly menuService = inject(MenuService);
  availableRoutes: { value: string; label: string }[] = [];

  @Input() formControl: FormControl<ShortcutDashboardConfig>;

  localConfig: ShortcutDashboardConfig;

  ngOnInit() {
    this.localConfig = {
      shortcuts: this.formControl.value.shortcuts
        ? [...this.formControl.value.shortcuts.map((s) => ({ ...s }))]
        : [],
    };
    this.availableRoutes = this.menuService.loadAvailableRoutes();
  }

  addShortcut() {
    this.localConfig.shortcuts.push({
      label: "New Shortcut",
      icon: "link",
      link: "/",
    });
    this.emitConfigChange();
  }

  removeShortcut(index: number) {
    this.localConfig.shortcuts.splice(index, 1);
    this.emitConfigChange();
  }

  moveShortcutUp(index: number) {
    if (index > 0) {
      const shortcut = this.localConfig.shortcuts.splice(index, 1)[0];
      this.localConfig.shortcuts.splice(index - 1, 0, shortcut);
      this.emitConfigChange();
    }
  }

  moveShortcutDown(index: number) {
    if (index < this.localConfig.shortcuts.length - 1) {
      const shortcut = this.localConfig.shortcuts.splice(index, 1)[0];
      this.localConfig.shortcuts.splice(index + 1, 0, shortcut);
      this.emitConfigChange();
    }
  }

  onShortcutChange() {
    this.emitConfigChange();
  }

  onShortcutItemChange(item: MenuItem, index: number) {
    this.localConfig.shortcuts[index] = { ...item };
    this.emitConfigChange();
  }

  private emitConfigChange() {
    this.formControl.setValue(this.localConfig);
  }
}
