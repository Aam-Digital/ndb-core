import { Component, Input, OnInit } from "@angular/core";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormControl } from "@angular/forms";
import { ShortcutDashboardConfig } from "../shortcut-dashboard-config";
import { DynamicFormControlComponent } from "#src/app/core/admin/admin-widget-dialog/dynamic-form-control.interface";
import { MenuItemListEditorComponent } from "../../../../core/ui/menu-item-list-editor/menu-item-list-editor.component";
import { MenuItemForAdminUi } from "../../../../core/admin/admin-menu/menu-item-for-admin-ui";

@DynamicComponent("ShortcutDashboardSettings")
@Component({
  selector: "app-shortcut-dashboard-settings",
  standalone: true,
  imports: [MenuItemListEditorComponent],
  templateUrl: "./shortcut-dashboard-settings.component.html",
  styleUrls: ["./shortcut-dashboard-settings.component.scss"],
})
export class ShortcutDashboardSettingsComponent
  implements OnInit, DynamicFormControlComponent<ShortcutDashboardConfig>
{
  @Input() formControl: FormControl<ShortcutDashboardConfig>;

  menuItems: MenuItemForAdminUi[] = [];

  ngOnInit() {
    const shortcuts = this.formControl.value.shortcuts || [];
    this.menuItems = MenuItemListEditorComponent.fromPlainMenuItems(
      shortcuts,
      false,
    );
  }

  onMenuItemsChange(updatedItems: MenuItemForAdminUi[]) {
    this.menuItems = updatedItems;
    const plainMenuItems =
      MenuItemListEditorComponent.toPlainMenuItems(updatedItems);
    this.formControl.setValue({ shortcuts: plainMenuItems });
  }
}
