import {
  Component,
  ChangeDetectionStrategy,
  input,
  linkedSignal,
} from "@angular/core";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormControl } from "@angular/forms";
import { ShortcutDashboardConfig } from "../shortcut-dashboard-config";
import { DynamicFormControlComponent } from "#src/app/core/admin/admin-widget-dialog/dynamic-form-control.interface";
import { MenuItemListEditorComponent } from "../../../../core/ui/menu-item-list-editor/menu-item-list-editor.component";
import { MenuItemForAdminUi } from "../../../../core/admin/admin-menu/menu-item-for-admin-ui";

@DynamicComponent("ShortcutDashboardSettings")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-shortcut-dashboard-settings",
  standalone: true,
  imports: [MenuItemListEditorComponent],
  templateUrl: "./shortcut-dashboard-settings.component.html",
  styleUrls: ["./shortcut-dashboard-settings.component.scss"],
})
export class ShortcutDashboardSettingsComponent implements DynamicFormControlComponent<ShortcutDashboardConfig> {
  formControl = input.required<FormControl<ShortcutDashboardConfig>>();

  menuItems = linkedSignal<MenuItemForAdminUi[]>(() =>
    MenuItemListEditorComponent.fromPlainMenuItems(
      this.formControl().value?.shortcuts ?? [],
      false,
    ),
  );

  onMenuItemsChange(updatedItems: MenuItemForAdminUi[]) {
    this.menuItems.set(updatedItems);
    const plainMenuItems = MenuItemListEditorComponent.toPlainMenuItems(
      updatedItems,
      { forceLinkOnly: true },
    );
    this.formControl().setValue({
      ...(this.formControl().value ?? ({} as ShortcutDashboardConfig)),
      shortcuts: plainMenuItems,
    });
    this.formControl().markAsDirty();
  }
}
