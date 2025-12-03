import { Component, inject, OnInit } from "@angular/core";
import {
  MenuItem,
  NavigationMenuConfig,
} from "app/core/ui/navigation/menu-item";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { MatButton } from "@angular/material/button";
import { MenuItemForAdminUi } from "./menu-item-for-admin-ui";
import { MenuItemListEditorComponent } from "../../ui/menu-item-list-editor/menu-item-list-editor.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";

/** Load and Store Menu Items for Administration */
@Component({
  selector: "app-admin-menu",
  standalone: true,
  imports: [ViewTitleComponent, MatButton, MenuItemListEditorComponent],
  templateUrl: "./admin-menu.component.html",
  styleUrl: "./admin-menu.component.scss",
})
export class AdminMenuComponent implements OnInit {
  private readonly entityMapper = inject(EntityMapperService);

  menuItems: MenuItemForAdminUi[] = [];
  private originalMenuItems: MenuItemForAdminUi[] = [];
  hasChanges = false;

  async ngOnInit() {
    await this.loadNavigationConfig();
  }

  private async loadNavigationConfig() {
    const configEntity = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    this.menuItems = MenuItemListEditorComponent.fromPlainMenuItems(
      configEntity.data.navigationMenu.items,
    );
    this.resetChangeTracking();
  }

  private resetChangeTracking() {
    // Store original state for change detection
    this.originalMenuItems = JSON.parse(JSON.stringify(this.menuItems));
    this.hasChanges = false;
  }

  async save() {
    const currentConfig = await this.entityMapper.load(
      Config<{ navigationMenu: NavigationMenuConfig }>,
      Config.CONFIG_KEY,
    );
    currentConfig.data.navigationMenu.items =
      MenuItemListEditorComponent.toPlainMenuItems(this.menuItems);
    await this.entityMapper.save(currentConfig);

    this.resetChangeTracking();
  }

  async cancel() {
    await this.loadNavigationConfig();
  }

  onMenuItemsChange(updatedItems: MenuItemForAdminUi[]) {
    this.menuItems = updatedItems;
    // Check if changes have been made
    this.hasChanges =
      JSON.stringify(this.menuItems) !== JSON.stringify(this.originalMenuItems);
  }
}
